-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261112000001 — Account approval, deactivation feedback and the
-- 30-day member engagement journey
--
-- 1. accounts.approval_status: 'pending' | 'approved' | 'rejected'. Every row
--    that exists when this runs becomes 'approved' (existing members keep their
--    access); from then on a new account starts 'pending'. It is separate from
--    account_status (active / suspended / deactivated …) and from photo
--    approval: approving a photo never approves an account.
-- 2. account_approvals: who changed an account's approval, when, and why.
-- 3. account_deactivations: the reason and feedback a member gives when they
--    deactivate, with the status they had before.
-- 4. messages.automated: marks the journey's messages so they can be told apart
--    from an admin writing by hand. Same conversations, same inbox.
-- 5. onboarding_messages (the 30 editable messages), member_onboarding (one
--    row per enrolled member) and onboarding_message_log (one row per member per
--    day — UNIQUE, so a day can never be sent twice).
-- 6. site_settings 'onboarding_automation': paused flag and the daily send time.
--
-- Every table is RLS-on with no policy and no grant for anon/authenticated:
-- the app reaches them only through the service role on the server.
-- Idempotent (safe to run twice). No dollar-quoting. Rollback at the bottom.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1 ─ approval status on accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS approval_updated_at timestamptz;
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_approval_status_check;
ALTER TABLE public.accounts ADD CONSTRAINT accounts_approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected'));
-- Existing rows were filled with 'approved' by the ADD COLUMN above; new ones start pending.
ALTER TABLE public.accounts ALTER COLUMN approval_status SET DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS accounts_approval_pending_idx ON public.accounts (created_at) WHERE approval_status = 'pending';

-- 2 ─ approval history
CREATE TABLE IF NOT EXISTS public.account_approvals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  reason      text,
  actor_id    uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_approvals_account_idx ON public.account_approvals (account_id, created_at DESC);

-- 3 ─ deactivation feedback
CREATE TABLE IF NOT EXISTS public.account_deactivations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  profile_id      uuid,
  reason          text NOT NULL CHECK (reason IN ('found_partner', 'getting_married', 'no_relevant_matches', 'not_satisfied', 'privacy', 'too_many_notifications', 'temporary_break', 'other')),
  other_reason    text,
  feedback        text,
  previous_status text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_deactivations_created_idx ON public.account_deactivations (created_at DESC);

-- 4 ─ automated flag on messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS automated boolean NOT NULL DEFAULT false;

-- 5 ─ the journey
CREATE TABLE IF NOT EXISTS public.onboarding_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day         integer NOT NULL CHECK (day >= 1),
  sort_order  integer NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  feature_url text,
  enabled     boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES public.accounts(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_messages_day_key ON public.onboarding_messages (day);

CREATE TABLE IF NOT EXISTS public.member_onboarding (
  account_id          uuid PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  profile_id          uuid,
  sequence_started_at timestamptz NOT NULL DEFAULT now(),
  current_day         integer NOT NULL DEFAULT 0,
  next_scheduled_at   timestamptz,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped')),
  stop_reason         text,
  completed_at        timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS member_onboarding_due_idx ON public.member_onboarding (next_scheduled_at) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.onboarding_message_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  message_id      uuid REFERENCES public.onboarding_messages(id) ON DELETE SET NULL,
  message_day     integer NOT NULL,
  chat_message_id uuid,
  delivery_status text NOT NULL DEFAULT 'sending' CHECK (delivery_status IN ('sending', 'sent', 'failed', 'skipped')),
  error_details   text,
  attempts        integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz
);
-- One delivery per member per day: the claim that makes sending idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_message_log_once ON public.onboarding_message_log (account_id, message_day);
CREATE INDEX IF NOT EXISTS onboarding_message_log_status_idx ON public.onboarding_message_log (delivery_status, created_at DESC);

-- 6 ─ automation settings
INSERT INTO public.site_settings (key, value) VALUES ('onboarding_automation', '{"paused": false, "send_hour": 9, "send_minute": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Lock all new tables to the server
ALTER TABLE public.account_approvals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deactivations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_onboarding      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_message_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_approvals, public.account_deactivations, public.onboarding_messages, public.member_onboarding, public.onboarding_message_log FROM anon, authenticated;

-- The 30 messages (only inserted if that day is not there yet, so edits made
-- in the Command Centre survive a re-run). Placeholders: {name}, {link},
-- {instagram_handle}, {instagram_url}.
INSERT INTO public.onboarding_messages (day, sort_order, title, body, feature_url) VALUES
  (1, 1, 'Mithila Jodi में आपका स्वागत है ❤️', 'नमस्कार {name} जी! ❤️

Mithila Jodi परिवार में आपका हार्दिक स्वागत है। आपका खाता स्वीकृत हो गया है।

Mithila Jodi मिथिला और मैथिल समाज के लिए बना है — यहाँ गोत्र, मूल और पैतृक गाँव प्रोफ़ाइल का हिस्सा हैं, और जीवनसाथी की तलाश परिवार के तरीक़े से होती है।

यहाँ आपको मिलेंगे मैट्रिमोनियल प्रोफ़ाइल, डिजिटल प्रोफ़ाइल, बायोडाटा, शादी के निमंत्रण-पत्र और कुंडली मिलान जैसी सुविधाएँ — सब निःशुल्क।

अगले कुछ दिनों तक हम रोज़ एक सुविधा से आपका परिचय कराएँगे।

हमारे साथ Instagram पर भी जुड़ें:
📸 {instagram_handle}
{instagram_url}

अपनी फ़ीड यहाँ देखें 👉 {link}

आपकी नई शुरुआत के लिए शुभकामनाएँ!
Mithila Jodi ❤️
जहाँ परंपरा मिले, प्रेम से।', '/home'),
  (2, 2, 'आपकी डिजिटल मैट्रिमोनियल प्रोफ़ाइल', 'नमस्कार {name} जी! 🌸

आज जानिए अपनी डिजिटल प्रोफ़ाइल के बारे में।

यह आपकी पूरी मैट्रिमोनियल प्रोफ़ाइल का एक सुंदर पेज है — व्यक्तिगत, शिक्षा, परिवार और मिथिला की जड़ों की जानकारी के साथ। इसका एक लिंक बनता है, जिसे आप सीधे WhatsApp पर रिश्तेदारों और परिचितों को भेज सकते हैं — उन्हें Mithila Jodi पर खाता बनाने की ज़रूरत नहीं।

चाहें तो संपर्क की जानकारी भी जोड़ें, ताकि लिंक देखने वाले परिवार आपसे बात कर सकें — क्या दिखेगा, यह आप तय करते हैं।

अपनी डिजिटल प्रोफ़ाइल देखें 👉 {link}

Mithila Jodi ❤️', '/digital-profile'),
  (3, 3, 'प्रीमियम शादी निमंत्रण', 'नमस्कार {name} जी! 💌

शादी तय हो जाए, तो निमंत्रण भी ख़ास होना चाहिए।

Mithila Jodi पर आप प्रीमियम डिजिटल निमंत्रण बना सकते हैं — मिथिला की कला से सजे डिज़ाइन, दूल्हा-दुल्हन के नाम, तिथि, स्थान और कार्यक्रम के साथ। निमंत्रण का एक छोटा लिंक बनता है जिसे WhatsApp पर भेजा जा सकता है, और बाद में बदलाव भी किए जा सकते हैं।

प्रीमियम निमंत्रण देखें 👉 {link}

Mithila Jodi ❤️', '/marriage-invitation/premium'),
  (4, 4, 'शादी का बायोडाटा — चार भाषाओं में', 'नमस्कार {name} जी! 📜

आज बात बायोडाटा की।

Mithila Jodi पर कुछ ही मिनटों में शादी का बायोडाटा बनाइए — मैथिली, हिन्दी, अंग्रेज़ी या संस्कृत में। गोत्र, मूल और गाँव ऊपर ही दिखते हैं, जैसे मिथिला के परिवार पढ़ते हैं। कई डिज़ाइन हैं, फ़ोटो जोड़ सकते हैं और PDF डाउनलोड कर सकते हैं।

बायोडाटा बनाएँ 👉 {link}

Mithila Jodi ❤️', '/marriage-biodata'),
  (5, 5, 'सरल और सुंदर शादी निमंत्रण', 'नमस्कार {name} जी! 🎉

कभी-कभी एक सादा निमंत्रण ही सबसे अच्छा लगता है।

साधारण निमंत्रण-पत्र में नाम, तिथि और स्थान भरिए, डिज़ाइन चुनिए और कार्ड को डाउनलोड करके WhatsApp पर भेज दीजिए — बिल्कुल निःशुल्क।

निमंत्रण बनाएँ 👉 {link}

Mithila Jodi ❤️', '/marriage-invitation/basic'),
  (6, 6, 'कुंडली मिलान', 'नमस्कार {name} जी! 🔯

बहुत से परिवार रिश्ता आगे बढ़ाने से पहले कुंडली मिलाते हैं।

Mithila Jodi पर कुंडली मिलान निःशुल्क है — वर और कन्या की जन्म तिथि, समय और स्थान डालिए। परिणाम में अष्टकूट गुण, मांगलिक स्थिति और उसका सरल अर्थ मिलता है, और परिणाम का लिंक परिवार के साथ साझा किया जा सकता है।

कुंडली मिलान करें 👉 {link}

Mithila Jodi ❤️', '/astrology/kundli-match'),
  (7, 7, 'जन्म कुंडली', 'नमस्कार {name} जी! 🌙

जन्म तिथि, समय और स्थान से अपनी जन्म कुंडली बनाइए — लग्न, राशि, नक्षत्र और ग्रहों की स्थिति के साथ।

विवाह की बातचीत में अक्सर यही जानकारी माँगी जाती है, तो एक बार बनाकर अपने पास रखिए।

जन्म कुंडली बनाएँ 👉 {link}

Mithila Jodi ❤️', '/astrology/janam-kundli'),
  (8, 8, 'मांगलिक दोष जाँच', 'नमस्कार {name} जी! 🔴

‘मांगलिक है या नहीं?’ — यह सवाल रिश्तों में अक्सर आता है।

Mithila Jodi का मांगलिक जाँच टूल आपकी जन्म कुंडली से देखता है कि मंगल किस भाव में है — लग्न और चंद्र दोनों से — और पारंपरिक अपवादों के साथ बताता है कि दोष पूर्ण है, आंशिक है या नहीं।

जाँच करें 👉 {link}

Mithila Jodi ❤️', '/astrology/manglik'),
  (9, 9, 'गुण मिलान — 36 गुण', 'नमस्कार {name} जी! ✨

कुंडली मिलान में 36 में से कितने गुण मिले — यह तो सब पूछते हैं। पर गुण क्या हैं और 18 से कम गुण का क्या मतलब है?

हमारा राशि-अनुकूलता पेज 36 गुणों से आगे भी बताता है — कौन-सा कूट क्या देखता है और किस बात पर ध्यान देना चाहिए। याद रखिए, गुण मिलान एक मार्गदर्शन है, रिश्ते की गारंटी नहीं।

पढ़ें और मिलान करें 👉 {link}

Mithila Jodi ❤️', '/astrology/compatibility'),
  (10, 10, 'विवाह मुहूर्त', 'नमस्कार {name} जी! 📅

रिश्ता पक्का हो जाए, तो अगला सवाल होता है — शादी कब?

Mithila Jodi पर इस साल और अगले साल के शुभ विवाह मुहूर्त की सूची देखिए — तिथि, नक्षत्र और समय के साथ। अंतिम तिथि अपने पंडित जी से ज़रूर तय करवाएँ।

विवाह मुहूर्त देखें 👉 {link}

Mithila Jodi ❤️', '/astrology/vivah-muhurat'),
  (11, 11, 'आपकी मैट्रिमोनियल फ़ीड', 'नमस्कार {name} जी! 🏠

आपकी फ़ीड आपका रोज़ का शुरुआती पेज है।

यहाँ दिखते हैं — इस हफ़्ते जुड़े अच्छे मैच, आपके लिए आई रुचियाँ (interests), आपकी प्रोफ़ाइल किसने देखी, और बिना पढ़े संदेश। नीचे ‘आपके लिए सुझाव’ में वे प्रोफ़ाइल हैं जो आपकी पसंद से सबसे अधिक मेल खाती हैं।

फ़ीड खोलें 👉 {link}

Mithila Jodi ❤️', '/home'),
  (12, 12, 'मैच प्रतिशत का मतलब', 'नमस्कार {name} जी! 📊

हर प्रोफ़ाइल पर एक मैच प्रतिशत दिखता है। यह बताता है कि वह प्रोफ़ाइल आपकी जानकारी और आपकी बताई पसंद से कितना मेल खाती है।

इसमें देखा जाता है — स्थान, गोत्र, उम्र, समुदाय, पैतृक जड़ें, शादी की समय-सीमा, जीवनशैली, शिक्षा और परिवार। एक ही गोत्र (सगोत्र) वाले मैच को कभी अच्छा मैच नहीं दिखाया जाता। कार्ड पर यह भी लिखा होता है कि क्या मिला और क्या नहीं।

ध्यान रहे — ऊँचा प्रतिशत एक अच्छी शुरुआत का संकेत है, सफल विवाह की गारंटी नहीं। अंतिम फ़ैसला बातचीत और परिवार का होता है।

पूरा तरीका पढ़ें 👉 {link}

Mithila Jodi ❤️', '/match-score'),
  (13, 13, 'प्रोफ़ाइल खोजें', 'नमस्कार {name} जी! 🔍

खोज पेज पर सबसे अच्छे मैच पहले दिखते हैं।

किसी प्रोफ़ाइल पर टैप करके पूरी जानकारी देखिए, पसंद आए तो ‘रुचि भेजें’ — चाहें तो एक छोटा संदेश भी जोड़ सकते हैं। दोनों तरफ़ से रुचि स्वीकार होने पर आप आपस में बात कर सकते हैं। बाद में देखने के लिए प्रोफ़ाइल को शॉर्टलिस्ट भी कर सकते हैं।

खोज शुरू करें 👉 {link}

Mithila Jodi ❤️', '/search'),
  (14, 14, 'WhatsApp पर प्रोफ़ाइल भेजें', 'नमस्कार {name} जी! 📲

मिथिला में रिश्ते अक्सर परिवार और रिश्तेदारों के ज़रिए आते हैं।

अपनी डिजिटल प्रोफ़ाइल का लिंक WhatsApp पर मामा-मौसी, चाचा-बुआ या परिचितों को भेजिए — वे बिना खाता बनाए आपकी प्रोफ़ाइल देख सकते हैं। आप कभी भी लिंक बंद कर सकते हैं और देख सकते हैं कि उसे कितनी बार खोला गया।

लिंक साझा करें 👉 {link}

Mithila Jodi ❤️', '/digital-profile'),
  (15, 15, 'संपर्क और गोपनीयता सेटिंग', 'नमस्कार {name} जी! 🔒

आपकी जानकारी पर आपका नियंत्रण है।

• फ़ोटो कौन देखे — सभी सदस्य, केवल मैच, या केवल वे जिन्हें आप अनुमति दें।
• आपका मोबाइल नंबर किसी प्रोफ़ाइल पर नहीं दिखता; संपर्क दोनों तरफ़ से मैच होने और आपकी अनुमति के बाद ही साझा होता है।
• किसी को भी ब्लॉक या रिपोर्ट किया जा सकता है।

सेटिंग देखें 👉 {link}

Mithila Jodi ❤️', '/settings'),
  (16, 16, 'गोत्र और मातृ-गोत्र', 'नमस्कार {name} जी! 🪔

मैथिल विवाह में गोत्र और मातृ-गोत्र सबसे पहले पूछे जाते हैं।

इन्हें प्रोफ़ाइल में जोड़ने से सगोत्र प्रोफ़ाइल अपने-आप अलग हो जाती हैं और सही रिश्ते जल्दी सामने आते हैं। मूल भी ज़रूर जोड़ें।

प्रोफ़ाइल में जोड़ें 👉 {link}

Mithila Jodi ❤️', '/profile/edit'),
  (17, 17, 'पैतृक गाँव और जड़ें', 'नमस्कार {name} जी! 🌾

‘गाँव कौन-सा है?’ — मिथिला में रिश्ते की बात अक्सर यहीं से शुरू होती है।

अपना पैतृक गाँव (ग्राम) और मूल निवास ज़िला प्रोफ़ाइल में जोड़िए। इससे परिवारों को जुड़ाव जल्दी समझ आता है, और खोज में ज़िले या गाँव से भी आपकी प्रोफ़ाइल मिलती है।

जानकारी जोड़ें 👉 {link}

Mithila Jodi ❤️', '/profile/edit'),
  (18, 18, 'शिक्षा और पेशा', 'नमस्कार {name} जी! 🎓

शिक्षा और काम की साफ़ जानकारी से परिवारों को निर्णय लेने में आसानी होती है।

अपनी डिग्री, पेशा, काम का शहर और (चाहें तो) आय की श्रेणी जोड़िए। मैच स्कोर में शिक्षा भी गिनी जाती है।

प्रोफ़ाइल अपडेट करें 👉 {link}

Mithila Jodi ❤️', '/profile/edit'),
  (19, 19, 'परिवार की जानकारी', 'नमस्कार {name} जी! 👨‍👩‍👧‍👦

मिथिला में विवाह दो परिवारों का मिलन है।

माता-पिता, भाई-बहन और परिवार के परिचय के बारे में कुछ पंक्तियाँ जोड़िए। सही और सरल जानकारी भरोसा बढ़ाती है।

परिवार की जानकारी जोड़ें 👉 {link}

Mithila Jodi ❤️', '/profile/edit'),
  (20, 20, 'प्रोफ़ाइल पूरी करें', 'नमस्कार {name} जी! ✅

पूरी प्रोफ़ाइल खोज में ऊपर आती है और ज़्यादा रुचियाँ पाती है।

अपनी प्रोफ़ाइल पेज पर ‘प्रोफ़ाइल स्ट्रेंथ’ देखिए — वहाँ लिखा है कि कौन-सी जानकारी बाकी है और उसे जोड़ने से कितना फ़र्क पड़ेगा।

अपनी प्रोफ़ाइल देखें 👉 {link}

Mithila Jodi ❤️', '/profile'),
  (21, 21, 'सही और सच्ची जानकारी', 'नमस्कार {name} जी! 🤝

अच्छे रिश्ते भरोसे से बनते हैं।

अपनी प्रोफ़ाइल में सही उम्र, सही फ़ोटो और सच्ची जानकारी रखिए। हर खाता OTP से सत्यापित मोबाइल से जुड़ा है और फ़ोटो की समीक्षा होती है — पर शिक्षा, आय या परिवार की जानकारी परिवार स्वयं भी जाँचें, जैसे हर रिश्ते में करते हैं।

सुरक्षा के बारे में पढ़ें 👉 {link}

Mithila Jodi ❤️', '/safety'),
  (22, 22, 'खोज और फ़िल्टर', 'नमस्कार {name} जी! 🎯

खोज में आप फ़िल्टर लगा सकते हैं — उम्र, लंबाई, शिक्षा, पेशा, वैवाहिक स्थिति, वर्तमान शहर, मूल निवास, गोत्र, मूल और गाँव। अपना गोत्र भरा हो, तो सगोत्र प्रोफ़ाइल अपने-आप हट जाती हैं।

फ़िल्टर आज़माएँ 👉 {link}

Mithila Jodi ❤️', '/search'),
  (23, 23, 'जीवनसाथी की पसंद', 'नमस्कार {name} जी! 💞

आप जैसा जीवनसाथी चाहते हैं — उम्र, शिक्षा, स्थान आदि — उसे ‘पसंद’ में भरिए।

इन्हीं से आपका मैच प्रतिशत और ‘आपके लिए सुझाव’ बनते हैं। समय-समय पर इन्हें अपडेट करते रहिए।

पसंद अपडेट करें 👉 {link}

Mithila Jodi ❤️', '/profile/preferences'),
  (24, 24, 'अपने समाज का मंच', 'नमस्कार {name} जी! 🌺

Mithila Jodi सिर्फ़ एक मैट्रिमोनियल साइट नहीं, मिथिला समाज का अपना मंच है।

यहाँ गोत्र, मूल और गाँव समझे जाते हैं, मैथिली में बायोडाटा बनता है, और त्योहार-गीत-परंपराओं से जुड़े लेख भी हैं। आपकी हर प्रोफ़ाइल अपने ही समाज के परिवारों तक पहुँचती है।

हमारे बारे में पढ़ें 👉 {link}

Mithila Jodi ❤️', '/about'),
  (25, 25, 'सुरक्षा और गोपनीयता', 'नमस्कार {name} जी! 🛡️

कुछ ज़रूरी बातें:
• पहली मुलाक़ात किसी सार्वजनिक जगह पर और परिवार की जानकारी में करें।
• पैसे या निजी दस्तावेज़ कभी न भेजें।
• कोई प्रोफ़ाइल संदिग्ध लगे, तो प्रोफ़ाइल पर ‘रिपोर्ट’ करें — हमारी टीम जाँच करती है।

पूरी जानकारी 👉 {link}

Mithila Jodi ❤️', '/safety'),
  (26, 26, 'प्रोफ़ाइल को बेहतर बनाने के सुझाव', 'नमस्कार {name} जी! 📸

छोटे बदलाव, बड़ा असर:
• साफ़ रोशनी में खिंची एक हालिया, मुस्कुराती फ़ोटो लगाइए।
• ‘अपने बारे में’ में 3–4 पंक्तियाँ अपने शब्दों में लिखिए — पसंद, मूल्य, परिवार।
• गोत्र, मूल, गाँव और शिक्षा की जानकारी पूरी रखिए।

प्रोफ़ाइल सुधारें 👉 {link}

Mithila Jodi ❤️', '/profile/edit'),
  (27, 27, 'Mithila Jodi को आगे बढ़ाइए', 'नमस्कार {name} जी! 🤗

आपके परिवार या दोस्तों में कोई जीवनसाथी की तलाश में है?

उन्हें Mithila Jodi के बारे में बताइए — जितने ज़्यादा मैथिल परिवार जुड़ेंगे, उतने ही अच्छे रिश्ते सबको मिलेंगे। जुड़ना निःशुल्क है।

यह लिंक भेजिए 👉 {link}

Mithila Jodi ❤️', '/join'),
  (28, 28, 'अक्सर पूछे जाने वाले सवाल', 'नमस्कार {name} जी! ❓

कुछ आम सवाल:
• क्या Mithila Jodi निःशुल्क है? — हाँ, अभी कोई सशुल्क प्लान नहीं है।
• मेरा नंबर कौन देख सकता है? — कोई नहीं, जब तक आप अनुमति न दें।
• प्रोफ़ाइल छिपानी हो तो? — सेटिंग में खाता निष्क्रिय कर सकते हैं।

और सवालों के जवाब यहाँ 👉 {link}

कुछ और पूछना हो, तो इसी संदेश का जवाब दीजिए।

Mithila Jodi ❤️', '/help'),
  (29, 29, 'सफल रिश्ते के लिए सुझाव', 'नमस्कार {name} जी! 🌼

कुछ बातें जो काम आती हैं:
• रुचि भेजते समय एक छोटा, आदरपूर्ण संदेश जोड़ें।
• जवाब में जल्दी न करें, पर बहुत देर भी न करें।
• बातचीत आगे बढ़े, तो जल्दी ही दोनों परिवारों को शामिल करें।

मिथिला की परंपराओं और विवाह पर लेख पढ़ें 👉 {link}

Mithila Jodi ❤️', '/blogs'),
  (30, 30, 'धन्यवाद ❤️', 'नमस्कार {name} जी! ❤️

पिछले 30 दिनों से Mithila Jodi के साथ रहने के लिए दिल से धन्यवाद।

हमें उम्मीद है कि ये सुविधाएँ आपकी तलाश को आसान बनाएँगी। आपकी कोई सलाह या शिकायत हो, तो इसी संदेश का जवाब दीजिए — हम पढ़ते हैं।

Instagram पर जुड़े रहिए: {instagram_handle}
{instagram_url}

अपनी फ़ीड 👉 {link}

आपको शुभ जीवनसाथी मिले — यही कामना है।
Mithila Jodi ❤️
जहाँ परंपरा मिले, प्रेम से।', '/home')
ON CONFLICT (day) DO NOTHING;

-- ROLLBACK (keeps member data; existing members stay usable):
--   ALTER TABLE public.accounts ALTER COLUMN approval_status SET DEFAULT 'approved';
--   UPDATE public.accounts SET approval_status = 'approved' WHERE approval_status = 'pending';
--   -- then, if you want the objects gone:
--   DROP TABLE IF EXISTS public.onboarding_message_log, public.member_onboarding, public.onboarding_messages, public.account_deactivations, public.account_approvals;
--   ALTER TABLE public.messages DROP COLUMN IF EXISTS automated;
--   ALTER TABLE public.accounts DROP COLUMN IF EXISTS approval_status, DROP COLUMN IF EXISTS approval_updated_at;
