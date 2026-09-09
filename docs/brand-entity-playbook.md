# Mithila Jodi — Brand Entity Playbook

**Problem this addresses:** searching "Mithila Jodi" returns an AI Overview describing
sacred Madhubani depictions of divine couples rather than the platform. Google has no
authoritative, corroborated statement that "Mithila Jodi" is a matrimonial company, so
the generic meaning of the words wins.

The on-site half is done (one canonical `Organization` node with `sameAs`,
`alternateName`, `founder` and `disambiguatingDescription`, emitted identically on every
page — see `apps/web/src/lib/seo.ts`). This file covers the off-site half, which is the
part that actually moves entity recognition and which cannot be done from the codebase.

**Order matters. Do not start with Wikidata.**

---

## Canonical boilerplate — use this text verbatim everywhere

Consistency *is* the signal. The same name, same description, same URL across every
profile is what lets Google reconcile them into one entity. Do not reword per platform.

**Name:** `Mithila Jodi`

**One line (under 100 chars):**
> A matrimonial platform for the Mithila (Maithili) community of India.

**Short (under 160 chars — matches the site's meta description):**
> A matrimonial platform for the Maithil community. Browse Mithila bride and groom
> profiles and build a marriage biodata in Maithili, Hindi, English or Sanskrit.

**Medium (for LinkedIn / Crunchbase "about"):**
> Mithila Jodi is a matrimonial platform for the Mithila (Maithili) community of India.
> It is built around how Maithil families actually arrange a marriage: gotra, mool and
> native place are treated as first-class details rather than optional extras, and
> gotra-safe matching is applied by default. Members can create a marriage biodata in
> Maithili, Hindi, English or Sanskrit and download it free. The platform is currently
> free for every member.

**Facts that are true and verifiable — safe to state:**

| Field | Value |
|---|---|
| Founded | 2026 |
| Founder | Sandeep Jha |
| Website | https://mithilajodi.com |
| Instagram | https://www.instagram.com/MithilaJodiOfficial/ |
| Contact | contact@mithilajodi.com |
| Country | India |
| Pricing | Free for all members |
| Languages | English, Hindi, Maithili, Sanskrit |

**Do NOT claim:** member or user counts, "India's largest/No.1", press coverage,
awards, verification levels the platform does not perform (there is no Aadhaar, PAN,
police or background verification — only mobile OTP), or a founding date earlier than
2026.

---

## Step 1 — Self-serve profiles (do now, no gate)

These accept self-submission, are crawled, and each one is a legitimate `sameAs` target.
Use the boilerplate above unchanged.

1. **LinkedIn Company Page** — highest value for effort. Google treats it as a strong
   organisation signal. Set name, website, industry (Internet / Matchmaking Services),
   founded 2026, and the medium description.
2. **Crunchbase** — accepts self-submitted company profiles, is crawled and is widely
   used as an entity source.
3. **Instagram bio** — make sure the bio text matches the one-line boilerplate and the
   website field is `https://mithilajodi.com`. It is already in `sameAs`.

**Not worth it / will be rejected:**
- *Google Business Profile* — requires a physical location or in-person service area.
  A purely online platform is not eligible; applying wastes time and can be flagged.
- *Paid directory listings and "brand mention" packages* — these are link schemes.
  They do not help entity recognition and carry real risk.

**When any of these exist, tell Claude the URLs** and they get added to `sameAs` in
`apps/web/src/lib/seo.ts` — that is a one-line change per URL.

---

## Step 2 — Independent references (the actual unlock)

Two or three credible, independent pages describing Mithila Jodi as a matrimonial
platform is what changes Google's understanding, and is also the precondition for
Wikidata.

**Who to approach:** Maithili literary and cultural societies, Mithila/Maithili
university departments and student associations, regional Maithili-language
publications and news sites, Madhubani art and heritage organisations, large Maithil
community groups that publish a newsletter or website.

**What makes this legitimate rather than link-begging:** you are offering something
genuinely free and useful to their members — a marriage biodata generator in Maithili,
and a platform that records gotra, mool and gram properly. Ask them to *use* it and
mention it if they find it useful. Never offer payment for a link, never ask for
specific anchor text, and never send this at scale.

### Outreach email — English

> **Subject:** A free Maithili marriage biodata tool for your members
>
> Namaste,
>
> I am Sandeep Jha. I built Mithila Jodi, a matrimonial platform for the Maithil
> community, because the mainstream matrimony sites treat gotra, mool and native gram as
> afterthoughts — if they record them at all.
>
> Two things on it may be useful to your members, and both are free with no account
> needed:
>
> - A marriage biodata generator that produces a proper biodata in **Maithili**, Hindi,
>   English or Sanskrit, with gotra, mool and gram included — downloadable as a PDF.
>   https://mithilajodi.com/marriage-biodata
> - Guides on gotra, maternal gotra, mool and gram, and on Mithila marriage customs.
>   https://mithilajodi.com/blogs
>
> The platform itself is free for every member. There is no paid tier and no payment
> step anywhere on it.
>
> If you think either is worth passing on to your members, I would be grateful — and if
> you spot anything inaccurate about how we describe Maithil custom, I would genuinely
> like to know and will correct it.
>
> Sandeep Jha
> Founder, Mithila Jodi
> https://mithilajodi.com · contact@mithilajodi.com

### Outreach email — Hindi

> **विषय:** आपके सदस्यों के लिए निःशुल्क मैथिली विवाह बायोडाटा टूल
>
> नमस्ते,
>
> मैं संदीप झा। मैंने मिथिला जोड़ी बनाया — मैथिल समुदाय के लिए एक वैवाहिक मंच — क्योंकि
> बड़ी मैट्रिमोनी वेबसाइटें गोत्र, मूल और मूल गाँव को गौण मानती हैं, या दर्ज ही नहीं करतीं।
>
> इस पर दो चीज़ें आपके सदस्यों के काम आ सकती हैं, दोनों निःशुल्क और बिना खाता बनाए:
>
> - विवाह बायोडाटा बनाने का साधन — **मैथिली**, हिन्दी, अंग्रेज़ी या संस्कृत में, गोत्र, मूल और
>   ग्राम सहित, PDF में डाउनलोड।  https://mithilajodi.com/marriage-biodata
> - गोत्र, नानिहाल गोत्र, मूल और ग्राम तथा मिथिला की विवाह परम्पराओं पर लेख।
>   https://mithilajodi.com/blogs
>
> मंच हर सदस्य के लिए निःशुल्क है — कोई शुल्क या भुगतान नहीं।
>
> यदि यह आपके सदस्यों के लिए उपयोगी लगे तो साझा करने की कृपा करें। और यदि मैथिल परम्परा के
> वर्णन में कहीं त्रुटि दिखे तो अवश्य बताइए, मैं सुधार करूँगा।
>
> संदीप झा
> संस्थापक, मिथिला जोड़ी

*A Maithili-language version would land better than Hindi with these organisations. It
is not included here because it should be written by a native speaker rather than
approximated — you are far better placed to write it than a translation would be.*

---

## Step 3 — Wikidata (only after Step 2)

Wikidata's notability policy (WD:N) requires an item to describe an entity that
"can be described using serious and publicly available references". A self-created item
for a new company citing only its own website is the standard profile of what gets
nominated for deletion, and a deleted item is worse than no item.

**Precondition:** at least two independent published references (Step 2). Then create it
— ideally not from the company's own account.

### Item draft

**Label (en):** `Mithila Jodi`
**Label (hi):** `मिथिला जोड़ी`
**Description (en):** `Indian online matrimonial platform for the Maithil community`
**Description (hi):** `मैथिल समुदाय के लिए भारतीय वैवाहिक मंच`

**Aliases (en):** `MithilaJodi`, `Mithila Jodi Matrimony`, `Mithila Jodi Matrimonial`

| Property | Value | Notes |
|---|---|---|
| instance of (P31) | business (Q4830453) | also consider website (Q35127) |
| instance of (P31) | online dating service (Q1064796) | closest match for matchmaking |
| country (P17) | India (Q668) | |
| official website (P856) | https://mithilajodi.com | |
| founded by (P112) | Sandeep Jha | create as a Person item only if independently notable, otherwise omit |
| inception (P571) | 2026 | |
| Instagram username (P2003) | MithilaJodiOfficial | |
| language of work (P407) | Maithili (Q36109), Hindi (Q1568), English (Q1860), Sanskrit (Q11059) | |
| official language /服务 area | India | via P17 above |

Every statement should carry a **reference** — `reference URL (P854)` pointing at the
independent source, plus `retrieved (P813)`. Statements sourced only to
mithilajodi.com are acceptable for uncontroversial facts like the official website, but
the item's existence must rest on the independent ones.

**Explicitly do not:** create a Wikipedia article. The notability bar there is much
higher than Wikidata's, a self-created article about one's own company breaches the
conflict-of-interest guideline, and a speedy deletion is a durable negative signal.

---

## What success looks like, and when

- **Days:** the site's own claim is unambiguous (already live).
- **Weeks:** self-serve profiles indexed; `sameAs` corroborated.
- **1–3 months:** with two or more independent references, the AI Overview and any
  knowledge panel begin reflecting the platform rather than the generic phrase.

There is no way to force any of this. Google re-evaluates entities on its own schedule,
the same as it does favicons.

## Measuring it

- Search `Mithila Jodi` and `Mithila Jodi matrimony` monthly; record what the AI
  Overview says.
- Search Console → Performance → filter queries containing `mithila jodi` and watch
  brand impressions and average position.
- Google Rich Results Test on https://mithilajodi.com to confirm the Organization node
  still parses after any change.
