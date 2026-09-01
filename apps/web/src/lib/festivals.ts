/**
 * Mithila Festivals — single source of truth.
 *
 * Pure data module (no DB, no client code) so every festival page can be
 * statically generated: fast on mobile, fully server-rendered for SEO.
 *
 * To add a festival: append one entry to FESTIVALS. Routes, the index grid,
 * the sitemap and internal links all derive from this array automatically.
 *
 * To add a song: append to that festival's `songs` array. We never host audio —
 * each song links out to a YouTube search (always valid), or to a specific
 * video if a `youtubeId` has been manually curated.
 */

export type MotifKind =
  | 'sun' | 'birds' | 'wedding' | 'colors' | 'goddess' | 'lamps' | 'vine' | 'moon'

export type FestivalSong = {
  /** Song title as commonly known (transliterated). */
  title: string
  /** Devanagari title, shown as a secondary line where available. */
  titleDeva?: string
  /** Singer, or the channel that published the recording. */
  artist: string
  /** One line: what it is, who sings it, when. */
  note: string
  /**
   * YouTube video id. Playback happens in an embedded player ON Mithila Jodi —
   * we never host audio and never redirect the listener to YouTube.
   * Songs without an id are omitted from the catalogue rather than linked out.
   */
  youtubeId: string
}

export type Ritual = {
  /** e.g. "Day 1" or "Evening" — optional. */
  when?: string
  title: string
  body: string
}

export type Festival = {
  slug: string
  name: string
  nameDeva: string
  /** Short evocative line used on cards and under the H1. */
  tagline: string
  /** e.g. "Kartik · October–November" */
  season: string
  duration: string
  /** True for festivals observed almost exclusively in Mithila. */
  uniquelyMithila?: boolean
  motif: MotifKind
  /** Hero gradient + accent, chosen per festival mood. */
  palette: { from: string; to: string; accent: string }
  /** 1–2 sentences. Appears in the hero and as the card description. */
  intro: string
  /** Story / history — paragraphs. */
  story: string[]
  /** Why it matters — short points. */
  significance: string[]
  rituals: Ritual[]
  /** The Mithila-specific cultural thread. */
  mithilaConnection: string[]
  songs: FestivalSong[]
  /** Slugs of related festivals. */
  related: string[]
  seo: { title: string; description: string; keywords: string[] }
  /**
   * Optional real photograph in /public (e.g. '/festivals/chhath.jpg').
   * When absent the page renders its Madhubani-inspired SVG hero art.
   */
  heroImage?: string
}

export const FESTIVALS: Festival[] = [
  // ───────────────────────────────────────────────────────────── Chhath
  {
    slug: 'chhath-puja',
    name: 'Chhath Puja',
    nameDeva: 'छठ पूजा',
    tagline: 'Four days of water, fasting and the rising sun',
    season: 'Kartik · October–November',
    duration: 'Four days',
    motif: 'sun',
    palette: { from: '#C4562F', to: '#7A1220', accent: '#E8912A' },
    intro:
      'The most beloved festival of Mithila and Bihar — four days of extraordinary discipline in which devotees stand in river water to offer arghya to the setting and rising sun.',
    story: [
      'Chhath is among the oldest continuously observed festivals in the Indian subcontinent, and it is addressed to a deity anyone can see: Surya, the sun. Alongside Surya is Chhathi Maiya, understood in Mithila as the guardian of children and of the household’s wellbeing.',
      'The festival is woven into the Ramayana and Mahabharata in popular memory — some traditions hold that Sita observed a sun vrat in Mithila, others that Draupadi and the Pandavas kept it during their exile. What is certain is that Chhath, unlike almost every other major Hindu festival, needs no temple, no priest and no idol. It requires a river, the sun, and a family willing to keep a very hard fast.',
      'The person who keeps the vrat is called the parvaitin. Most are women, though men keep it too. The central fast is nirjala — without food and without water — and it runs roughly thirty-six hours, from the evening of Kharna until the sun rises on the fourth morning.',
    ],
    significance: [
      'A festival of gratitude to the sun — the one deity visible to everyone, worshipped without idol, temple or priest.',
      'Chhathi Maiya is invoked for the health and long life of children, making it deeply a family observance.',
      'Famously egalitarian: the ghat belongs to everyone, and prasad is shared across every household that passes by.',
      'Purity and restraint matter more than expense — the offerings are fruit, sugarcane and hand-made thekua.',
    ],
    rituals: [
      {
        when: 'Day 1',
        title: 'Nahay Khay — bathe and eat',
        body: 'The parvaitin bathes in a river or pond, brings home water for cooking, and eats one sattvic meal — usually kaddu-bhat, bottle-gourd with rice and chana dal, cooked without onion or garlic. The house is scrubbed clean; from here on the kitchen is ritually guarded.',
      },
      {
        when: 'Day 2',
        title: 'Kharna — the last meal',
        body: 'A day-long fast ends after sunset with rasiaw-kheer (jaggery kheer), roti and fruit, eaten in silence. Once this meal is finished the nirjala fast begins — no food, no water, for the next thirty-six hours.',
      },
      {
        when: 'Day 3',
        title: 'Sandhya Arghya — offering to the setting sun',
        body: 'The whole family walks to the ghat carrying bamboo soop and daala loaded with thekua, sugarcane, coconut, banana and seasonal fruit. The parvaitin stands waist-deep in the water and offers arghya to the setting sun. Diyas are floated; the songs begin.',
      },
      {
        when: 'Day 4',
        title: 'Usha Arghya — offering to the rising sun',
        body: 'Before dawn the family returns to the same ghat. Arghya is offered to the first light, the vrat is broken with sharbat and a little prasad, and the parvaitin takes blessings. Thekua is then distributed to everyone — neighbours, strangers, children at the ghat.',
      },
    ],
    mithilaConnection: [
      'In Mithila, Chhath is not one festival among many — it is the year’s emotional centre. Households that have moved to Delhi, Mumbai or abroad plan the entire year’s travel around it.',
      'Thekua, the wheat-and-jaggery prasad pressed in carved wooden moulds, is made at home over days. The moulds themselves are often inherited.',
      'The ghats of the Kosi, Kamla, Bagmati and Ganga fill with families in the Maithil belt — Darbhanga, Madhubani, Samastipur, Saharsa, Sitamarhi — and the singing carries across the water from one group to the next.',
      'Aripan, the Maithil floor art drawn in rice paste, marks the courtyard and the path to the ghat.',
    ],
    songs: [
      {
        title: 'Kelwa Ke Paat Par',
        titleDeva: 'केलवा के पात पर',
        artist: 'Sharda Sinha',
        note: 'The best-known Chhath geet of all — sung as the daala is prepared and carried to the ghat.',
        youtubeId: 'knZ8b5YnQiY',
      },
      {
        title: 'Kelwa Ke Paat Par (Lyrical)',
        titleDeva: 'केलवा के पात पर',
        artist: 'Sharda Sinha',
        note: 'The same geet with on-screen lyrics — useful if you are learning the words.',
        youtubeId: 'y7hrM7PouQM',
      },
      {
        title: 'Pahile Pahil Chhathi Maiya',
        titleDeva: 'पहिले पहिल छठी मैया',
        artist: 'Sharda Sinha',
        note: 'Sung by a family keeping the vrat for the first time — one of the most loved Chhath songs.',
        youtubeId: 'DG8F-csoRAQ',
      },
      {
        title: 'Chhathi Maiya — Chhath Pooja Geet',
        titleDeva: 'छठी मैया',
        artist: 'Sharda Sinha',
        note: 'A longer collection of invocations to Chhathi Maiya for the evening vigil.',
        youtubeId: 'BsAFCc901MM',
      },
    ],
    related: ['kojagara', 'diwali', 'sama-chakeva'],
    seo: {
      title: 'Chhath Puja in Mithila — Rituals, Four Days, Songs & Significance',
      description:
        'A complete guide to Chhath Puja in Mithila: the four days from Nahay Khay to Usha Arghya, the thirty-six hour nirjala fast, thekua prasad, ghat rituals and the best-loved Chhath geet.',
      keywords: [
        'Chhath Puja', 'Chhath Puja Mithila', 'Chhath Puja rituals', 'Chhath geet',
        'Nahay Khay', 'Kharna', 'Sandhya Arghya', 'Usha Arghya', 'thekua',
        'Chhath Puja Bihar', 'Maithili Chhath songs',
      ],
    },
  },

  // ─────────────────────────────────────────────────────── Sama Chakeva
  {
    slug: 'sama-chakeva',
    name: 'Sama Chakeva',
    nameDeva: 'सामा चकेवा',
    tagline: 'Sisters, clay birds, and a farewell sung at the field’s edge',
    season: 'Kartik · November–December',
    duration: 'About a week, ending on Kartik Purnima',
    uniquelyMithila: true,
    motif: 'birds',
    palette: { from: '#2E7048', to: '#1F5133', accent: '#E4C572' },
    intro:
      'A festival that exists almost nowhere but Mithila — sisters shape clay birds, sing to them for a week, and then send them away with a farewell that sounds exactly like a vidai.',
    story: [
      'Sama Chakeva begins when the migratory birds arrive in the Mithila plains after the monsoon. Sisters make small clay figures — Sama and her brother Chakeva, along with Chugla the tale-bearer, Satbhainya the seven brothers, and Dhorik — place them in bamboo baskets, and care for them as though they were guests in the house.',
      'The story behind it: Sama, daughter of Krishna, is falsely accused by Chugla of impropriety. Her father, believing the slander, curses her into the form of a bird. Her brother Chakeva refuses to abandon her — he undertakes penance, exposes Chugla’s lie, and wins back her human form.',
      'So the festival is, at heart, about a brother who did not believe the gossip. For a week, groups of sisters gather each evening with their baskets, sing to the figures, tease Chugla, and enact the story. On Kartik Purnima the figures are broken or floated away, and the songs turn into a farewell — the same songs, in the same register, that Mithila sings when a daughter leaves home after her wedding.',
    ],
    significance: [
      'A celebration of the brother–sister bond that is distinct from Raksha Bandhan: here the sister prays for the brother, and the brother’s loyalty is the story’s moral.',
      'A pointed folk warning about slander — Chugla, the tale-bearer, is mocked and symbolically burnt every year.',
      'Tied to the land and its seasons: the festival is timed to the arrival of migratory birds in the Mithila wetlands.',
      'One of the clearest surviving examples of a festival authored and carried entirely by women.',
    ],
    rituals: [
      {
        title: 'Making the figures',
        body: 'Sisters shape Sama, Chakeva, Chugla, Satbhainya and Dhorik from river clay, then paint them. The bamboo basket that holds them is decorated and kept carefully indoors.',
      },
      {
        when: 'Each evening',
        title: 'Gathering and singing',
        body: 'Groups of sisters meet in a courtyard or at the edge of a field, place the baskets down, and sing Sama Chakeva geet in Maithili — call-and-response, one group answering another across the dark.',
      },
      {
        title: 'Chugla’s punishment',
        body: 'The figure of Chugla, the informer, is symbolically singed or burnt — the community’s annual verdict on gossip and false witness.',
      },
      {
        when: 'Kartik Purnima',
        title: 'Sama’s vidai',
        body: 'On the final night the figures are broken or set afloat and the brothers offer them a token. The songs become farewell songs; sisters weep as they would at a vidai, and ask the birds to return next year.',
      },
    ],
    mithilaConnection: [
      'Sama Chakeva is observed in the Maithili-speaking region and very little beyond it. If you meet someone who grew up with it, you have almost certainly met a Maithil.',
      'The song repertoire is entirely oral and entirely in Maithili, passed from older sisters and aunts to younger girls in the courtyard.',
      'The festival closes the Kartik cycle that begins with Chhath — Mithila moves from the ghat to the field’s edge within a fortnight.',
      'The clay-and-bamboo craft, and the painted figures, sit in the same visual world as Madhubani painting.',
    ],
    songs: [
      {
        title: 'Sama Vidai Geet',
        titleDeva: 'सामा बिदाई गीत',
        artist: 'Maithili Ganga',
        note: 'The farewell sung on Kartik Purnima as the clay figures are floated away.',
        youtubeId: 'E63kxMtYf7M',
      },
      {
        title: 'Paramparik Sama Chakeva Geet',
        titleDeva: 'पारम्परिक सामा चकेवा गीत',
        artist: 'Maithili traditional (nonstop)',
        note: 'A long traditional set — the closest thing to sitting in the courtyard through an evening.',
        youtubeId: 'lN4pMJ2ToOE',
      },
      {
        title: 'Kone Bhaiya Ke Ghodwa',
        titleDeva: 'कोने भैया के घोड़वा',
        artist: 'Maithili Geet Maala',
        note: 'A well-known Sama geet naming the brothers, sung call-and-response.',
        youtubeId: '6n5K9wnLp14',
      },
      {
        title: 'Sama Ke Fakra',
        titleDeva: 'सामा के फकड़ा',
        artist: 'Maithili Geet Maala',
        note: 'The teasing fakra verses — including the mocking of Chugla, the tale-bearer.',
        youtubeId: 'HvkgodJ69M8',
      },
      {
        title: 'Top 5 Sama Chakeva Geet',
        titleDeva: 'सामा चकेवा गीत संग्रह',
        artist: 'Babita Yadav, Mala Jha, Puja Jha & others',
        note: 'A five-song collection covering the main moments of the festival.',
        youtubeId: 'jy1wZ5H97Co',
      },
    ],
    related: ['chhath-puja', 'madhushravani', 'kojagara'],
    seo: {
      title: 'Sama Chakeva — Mithila’s Festival of Sisters, Clay Birds & Folk Songs',
      description:
        'Sama Chakeva is celebrated almost only in Mithila. Learn the story of Sama and Chakeva, how sisters make and sing to the clay birds, the punishment of Chugla, and the vidai on Kartik Purnima.',
      keywords: [
        'Sama Chakeva', 'Sama Chakeva festival', 'Mithila festival', 'Maithili folk festival',
        'Sama Chakeva geet', 'Sama Chakeva story', 'brother sister festival Mithila',
        'Kartik Purnima Mithila', 'Maithili songs',
      ],
    },
  },

  // ────────────────────────────────────────────────────── Vivah Panchami
  {
    slug: 'vivah-panchami',
    name: 'Vivah Panchami',
    nameDeva: 'विवाह पंचमी',
    tagline: 'The day Mithila married its daughter to Ayodhya',
    season: 'Margashirsha · November–December',
    duration: 'One day, with days of preparation',
    motif: 'wedding',
    palette: { from: '#9B2233', to: '#5A0E19', accent: '#E4C572' },
    intro:
      'The anniversary of the marriage of Sita and Ram. For Mithila this is not a story about somewhere else — Sita is Mithila’s daughter, and this is her wedding day.',
    story: [
      'Vivah Panchami falls on the fifth day of the bright fortnight of Margashirsha, the day the Ramayana marks as the marriage of Sita, daughter of King Janak of Mithila, to Ram of Ayodhya.',
      'The events belong to Mithila: the swayamvar, the breaking of Shiva’s bow, Janak’s condition, the arrival of the baraat from Ayodhya. In Bihar, Punaura Dham in Sitamarhi is revered as Sita’s birthplace, and the region’s temples and households observe the day as the anniversary of a wedding in the family.',
      'That is the distinctive thing about Vivah Panchami in Mithila. Elsewhere it is a devotional occasion. Here it carries the specific ache of the bride’s side of a wedding — pride in the match, and the knowledge that the daughter will leave. Maithil wedding songs and Vivah Panchami songs share the same melodies for exactly this reason.',
    ],
    significance: [
      'Marks the marriage of Sita and Ram — for Mithila, the wedding of the region’s own daughter.',
      'The origin point of Maithil wedding culture: many rituals in a Maithil vivah are understood as re-enactments of this marriage.',
      'A day when the Ramayana is read and sung as family history rather than distant scripture.',
      'Temples across the Mithila belt hold a full ceremonial marriage, complete with baraat, mandap and vidai.',
    ],
    rituals: [
      {
        title: 'Ceremonial marriage',
        body: 'Temples install images of Sita and Ram and conduct a complete wedding — haldi, mandap, the seven rounds, sindoor daan and vidai — with the congregation taking the roles of the two families.',
      },
      {
        title: 'Ramayana recitation',
        body: 'Households read or sing the Bal Kand — the swayamvar, the bow, the marriage — often through the night. In Mithila the Maithili Ramayana and Vidyapati’s compositions are favoured.',
      },
      {
        title: 'Songs of both sides',
        body: 'Women sing the bride’s-side repertoire: songs of Janak’s household, of receiving the baraat, of Sita’s departure. The same songs return at real Maithil weddings.',
      },
      {
        title: 'Fasting and offering',
        body: 'Many keep a fast until the ceremonial marriage is complete, then share prasad. Newly married couples and those seeking a match seek blessings on this day.',
      },
    ],
    mithilaConnection: [
      'Sita — Janaki, Maithili, Vaidehi — is named after this land. Two of her three most common names simply mean "of Mithila".',
      'The structure of a traditional Maithil vivah, and its songs, are traced by families directly to this wedding.',
      'For Mithila the emotional centre of the Ramayana is not conquest but a wedding and a departure — which is why the vidai songs are the ones that survive best.',
      'Punaura Dham in Sitamarhi and the temples of Darbhanga and Madhubani see the largest observances in the Indian Mithila belt.',
    ],
    songs: [
      {
        title: 'Maithili Vivah Panchami Geet',
        titleDeva: 'मैथिली विवाह पंचमी गीत',
        artist: 'Maithili Ganga',
        note: 'The marriage sequence sung as a Maithil wedding would be — mandap through vidai.',
        youtubeId: 'zKfJTp-hkAc',
      },
      {
        title: 'Raja Janak Ji Ke Ek Beti Sita',
        titleDeva: 'राजा जनक जी के एक बेटी सीता',
        artist: 'Maithili Vivah Geet',
        note: 'A samdaun geet from the bride’s side — Janak’s household giving away its daughter.',
        youtubeId: '_Gdh84IZoVY',
      },
      {
        title: 'Ram Ji Se Puche Janpur Ke Nari',
        titleDeva: 'राम जी स पूछे जनपुर के नारी',
        artist: 'Maithili Vivah Geet',
        note: 'The women of Janakpur questioning Ram — a much-loved narrative geet.',
        youtubeId: 'AYgDvvjo-7w',
      },
      {
        title: 'Ram Vivah Geet',
        titleDeva: 'राम विवाह गीत',
        artist: 'Maithili Geet Maala',
        note: 'Traditional Ram–Sita marriage songs in the Mithilanchal style.',
        youtubeId: 'BDVFNWJE-tc',
      },
      {
        title: 'Top 5 Vivah Panchami Geet',
        titleDeva: 'विवाह पंचमी स्पेशल गीत',
        artist: 'Various Maithili artists',
        note: 'A five-song set for the day of the ceremonial marriage.',
        youtubeId: 'VZPUqfhmDFY',
      },
    ],
    related: ['madhushravani', 'durga-puja', 'chhath-puja'],
    seo: {
      title: 'Vivah Panchami in Mithila — Sita & Ram’s Marriage, Rituals and Songs',
      description:
        'Vivah Panchami marks the marriage of Sita and Ram. Understand why Mithila observes it as a wedding in the family, how temples enact the ceremony, and the vivah geet sung on the day.',
      keywords: [
        'Vivah Panchami', 'Vivah Panchami Mithila', 'Sita Ram marriage', 'Janak Nandini',
        'Sita birthplace Sitamarhi', 'Punaura Dham', 'Maithil vivah', 'vivah geet Maithili',
        'Mithila festival', 'Margashirsha Panchami',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────── Holi
  {
    slug: 'holi',
    name: 'Holi — Phaguwa',
    nameDeva: 'होली · फगुआ',
    tagline: 'Jogira, malpua, and colour on everyone’s doorstep',
    season: 'Phalgun · March',
    duration: 'Two days',
    motif: 'colors',
    palette: { from: '#E8912A', to: '#C4562F', accent: '#2E7048' },
    intro:
      'In Mithila, Holi is called Phaguwa — and its signature is not the colour but the singing. Groups move house to house through the morning trading Jogira couplets.',
    story: [
      'Holi’s story is the story of Holika: Prahlad’s devotion, his father Hiranyakashipu’s fury, and the pyre that consumed Holika instead of the child. On Phalgun Purnima that pyre is lit again as Samat — the Holika Dahan — and the next morning belongs to colour.',
      'What makes Mithila’s Phaguwa distinct is the music. Phagua and Jogira are seasonal song forms, and Jogira in particular is built for improvisation: a leader sings a rhymed couplet, the group answers "Jogira sa ra ra ra", and the next couplet has to be invented on the spot. It can be devotional, comic, satirical or gently obscene, and it is often about the people standing right there.',
      'The other Maithil signature is food. Malpua fried in ghee, dahi-bara, thekua, and in many households a spread that keeps arriving as each singing group reaches the door. Phaguwa in Mithila is more a moving feast with a soundtrack than a colour fight.',
    ],
    significance: [
      'Marks the victory of devotion over tyranny — Prahlad’s faith outlasting Hiranyakashipu’s power.',
      'A licensed levelling: on Phaguwa morning age, status and formality are suspended, and Jogira can tease anyone.',
      'A spring and harvest festival — Phalgun closes the winter crop and opens the warm season.',
      'A day for repairing relations; visiting someone with colour is an accepted way to end a quarrel.',
    ],
    rituals: [
      {
        when: 'Evening 1',
        title: 'Samat — Holika Dahan',
        body: 'A community pyre of wood, dried cow-dung cakes and stalks is lit at a crossroads or in the village square. People circle it, offer grain and new barley, and carry a little ash home.',
      },
      {
        when: 'Morning 2',
        title: 'Colour and abir',
        body: 'Dry abir is applied to the feet of elders first as a mark of respect, then colour moves freely. In Mithila the day starts early and is largely done by afternoon.',
      },
      {
        title: 'Jogira and Phagua singing',
        body: 'Groups with dholak, jhaal and manjira go house to house. A leader improvises a couplet, everyone answers "Jogira sa ra ra ra" — the reply is fixed, the verse never is.',
      },
      {
        title: 'The Phaguwa spread',
        body: 'Malpua, dahi-bara, pua, thekua and sweets are served to every group that arrives. Afternoon is for bathing, clean clothes, and visiting elders to take blessings.',
      },
    ],
    mithilaConnection: [
      'The word most Maithils use is Phaguwa, not Holi — and Jogira is its defining sound.',
      'Jogira’s improvised couplets are a living Maithili oral form: the melody is inherited, the words are made up in the moment.',
      'Malpua holds the place that gujiya holds further west; a Maithil Phaguwa without malpua is incomplete.',
      'Applying abir to an elder’s feet before playing colour keeps the day’s licence inside a frame of respect.',
    ],
    songs: [
      {
        title: 'Jogira Sa Ra Ra Ra',
        titleDeva: 'जोगीरा सा रा रा रा',
        artist: 'Prakash Sharma',
        note: 'The Jogira form itself — improvised couplets with the fixed communal response.',
        youtubeId: 'H_YcK2KKDGw',
      },
      {
        title: 'Jogira Sa Ra Ra',
        titleDeva: 'जोगीरा सा रा रा',
        artist: 'Ajeet Pandey Vidrohi',
        note: 'Another Jogira set, closer to the dugola style sung between competing groups.',
        youtubeId: 'gUqraRub9aY',
      },
      {
        title: 'Paramparik Maithili Holi Geet',
        titleDeva: 'मैथिली पारंपरिक होली गीत',
        artist: 'Sangeeta Jha',
        note: 'A traditional Maithili Holi geet, lyrics by Dinesh Jha Madhav.',
        youtubeId: 'EBuKJvaDcII',
      },
      {
        title: 'Top 5 Maithili Holi Geet',
        titleDeva: 'मैथिली होली गीत',
        artist: 'Bhawna Mishra',
        note: 'Five Phaguwa songs — the sort played through the morning as groups move house to house.',
        youtubeId: 'gFOcREHUY0U',
      },
      {
        title: 'Maithili Top 10 Holi Geet',
        titleDeva: 'मैथिली स्पेशल होली गीत',
        artist: 'Maithili Ganga',
        note: 'A long Phaguwa playlist for the whole day.',
        youtubeId: 'X-nP5EIw5WA',
      },
    ],
    related: ['durga-puja', 'diwali', 'madhushravani'],
    seo: {
      title: 'Holi in Mithila (Phaguwa) — Jogira Songs, Samat, Malpua & Traditions',
      description:
        'Holi in Mithila is Phaguwa: Samat on Phalgun Purnima, abir at the elders’ feet, malpua and dahi-bara, and the improvised Jogira couplets that give the day its sound.',
      keywords: [
        'Holi Mithila', 'Phaguwa', 'Jogira', 'Jogira sa ra ra ra', 'Maithili Holi songs',
        'Holika Dahan Samat', 'malpua Holi', 'Phagua geet', 'Bihar Holi traditions',
      ],
    },
  },

  // ────────────────────────────────────────────────────────── Durga Puja
  {
    slug: 'durga-puja',
    name: 'Durga Puja',
    nameDeva: 'दुर्गा पूजा',
    tagline: 'Nine nights of the Goddess in a land that has always been Shakta',
    season: 'Ashwin · September–October',
    duration: 'Ten days',
    motif: 'goddess',
    palette: { from: '#7A1220', to: '#5A0E19', accent: '#E8912A' },
    intro:
      'Mithila’s devotion to the Goddess is old and unbroken. Through Ashwin’s nine nights the region turns to Durga, and Darbhanga and Madhubani fill with pandals and Devi geet.',
    story: [
      'Durga Puja recalls Durga’s defeat of Mahishasura — the demon no god could kill, undone by a goddess assembled from all their powers. The nine nights of Navratri lead to Vijayadashami, the tenth day of victory.',
      'Mithila’s connection to Shakti worship runs deeper than the festival calendar. This is a historically Shakta region: Devi in her many forms — Durga, Kali, Tara, Chhinnamasta — is central to Maithil religious life, and the temple of Chhinnamasta at Ugratara and the Kali shrines of the Maithil towns are part of the same devotional world.',
      'The observance blends household ritual with public spectacle. Inside, families keep the kalash, the fast and the daily paath. Outside, pandals rise in Darbhanga, Madhubani, Samastipur and Muzaffarpur, and the streets stay awake from Saptami to Dashami.',
    ],
    significance: [
      'Celebrates the Goddess as the decisive power — the one who ends what the gods could not.',
      'Reflects Mithila’s long Shakta tradition, in which Devi worship is central rather than seasonal.',
      'The nine nights honour nine forms of the Goddess, each with its own colour, offering and mood.',
      'Vijayadashami is considered among the most auspicious days of the year for beginnings.',
    ],
    rituals: [
      {
        when: 'Day 1',
        title: 'Kalash Sthapana',
        body: 'A pot of water is installed with mango leaves and a coconut, and barley is sown in earth beside it. The sprouts, jayanti, are cut on Dashami and worn or kept.',
      },
      {
        when: 'Days 1–9',
        title: 'Navratri fast and paath',
        body: 'Families keep a fast of varying strictness and recite the Durga Saptashati or Devi Kavach daily. A lamp is kept burning without interruption.',
      },
      {
        when: 'Day 6',
        title: 'Bel Nimantran and Bodhan',
        body: 'The Goddess is formally invited on Shashthi, with worship at a bel tree in the evening. From this point the public pandals open.',
      },
      {
        when: 'Days 7–9',
        title: 'Saptami, Ashtami, Navami',
        body: 'The three great nights: Sandhya puja, Sandhi puja at the junction of Ashtami and Navami, kumari puja in many households, and continuous Devi geet and dhaak.',
      },
      {
        when: 'Day 10',
        title: 'Vijayadashami',
        body: 'Sindoor is exchanged among married women, the immersion procession sets out, and elders are touched for blessings. New ventures, tools and account books are begun on this day.',
      },
    ],
    mithilaConnection: [
      'Mithila is a Shakta heartland — Devi is not a seasonal guest here but the presiding presence of the year.',
      'Maithili Devi geet form a distinct repertoire, sung by women in the household through all nine nights.',
      'Darbhanga’s and Madhubani’s pandals, and the Kali shrines of the smaller towns, anchor the public festival.',
      'Madhubani painting draws constantly on Durga and Kali iconography — the festival and the art share a visual grammar.',
    ],
    songs: [
      {
        title: 'Maithili Bhagwati Geet',
        titleDeva: 'मैथिली भगवती गीत',
        artist: 'Pt. Premnath Jha',
        note: 'Classical Maithili Bhagwati geet — the household repertoire for the nine nights.',
        youtubeId: '8q8bSnawTQE',
      },
      {
        title: 'Maliya Ke Betwa',
        titleDeva: 'मलिया के बेटवा',
        artist: 'Annu Chaudhary',
        note: 'A much-sung Maithili Devi geet for Durga Puja.',
        youtubeId: 'wIIXO-_g03k',
      },
      {
        title: 'Suniyo He Durga',
        titleDeva: 'सुनियो हे दुर्गा',
        artist: 'Madhav Rai',
        note: 'A direct appeal to the Goddess, in the older Maithili devotional style.',
        youtubeId: 'z5aobwVIaHQ',
      },
      {
        title: 'Nonstop Durga Puja Special',
        titleDeva: 'नॉनस्टॉप दुर्गा पूजा गीत',
        artist: 'Various Maithili artists',
        note: 'A long jukebox — suits the continuous singing of Saptami to Navami.',
        youtubeId: 'Rx_TLFLusGs',
      },
      {
        title: 'Top 5 Navratri Devi Geet',
        titleDeva: 'नवरात्रि देवी गीत',
        artist: 'Various Maithili artists',
        note: 'Five Bhagwati geet for the nine nights.',
        youtubeId: 'jjZOLVLhttM',
      },
    ],
    related: ['kojagara', 'diwali', 'vivah-panchami'],
    seo: {
      title: 'Durga Puja in Mithila — Navratri Rituals, Devi Geet & Shakta Tradition',
      description:
        'Durga Puja in Mithila, from Kalash Sthapana to Vijayadashami: Bel Nimantran, Sandhi puja, the nine nights of Devi geet, and the Shakta tradition that shapes Maithil religious life.',
      keywords: [
        'Durga Puja Mithila', 'Navratri Mithila', 'Maithili Devi geet', 'Jai Jai Bhairavi',
        'Vijayadashami', 'Durga Puja Darbhanga', 'Shakta tradition Mithila',
        'Durga Puja Bihar', 'Sandhi puja',
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── Diwali
  {
    slug: 'diwali',
    name: 'Diwali & Kali Puja',
    nameDeva: 'दीपावली · काली पूजा',
    tagline: 'Lamps at every threshold, aripan at every door, Kali through the night',
    season: 'Kartik Amavasya · October–November',
    duration: 'Five days',
    motif: 'lamps',
    palette: { from: '#2E3A6E', to: '#5A0E19', accent: '#E4C572' },
    intro:
      'Mithila keeps Diwali twice over — lamps and Lakshmi at dusk, and then Kali Puja through the same night, which is the region’s own emphasis.',
    story: [
      'Diwali marks Ram’s return to Ayodhya after fourteen years of exile, the city lit end to end to receive him. On the darkest night of Kartik, light is set against the dark deliberately.',
      'For Mithila the return has a particular resonance: the one coming home to Ayodhya is Mithila’s son-in-law, and the one returning with him is Mithila’s daughter. The Ramayana’s geography closes a circle on this night.',
      'Mithila’s distinctive practice is what happens after the lamps are lit. On the same Kartik Amavasya night, households and neighbourhood pandals keep Kali Puja — the Goddess worshipped through the night, in a Shakta emphasis that Mithila shares with Bengal and that sets the region apart from much of northern India, where the night belongs to Lakshmi alone.',
      'And on the courtyard floor is aripan: the Maithil ritual drawing in rice paste, laid at the threshold, around the tulsi, and at the place of worship. Its lotus and geometric forms belong to the same tradition as Madhubani painting.',
    ],
    significance: [
      'Light deliberately set against the year’s darkest night — dipawali, a row of lamps.',
      'Ram’s homecoming, which in Mithila is also the story of its daughter’s new home.',
      'Lakshmi is invited into a cleaned, lit, decorated house at dusk; Kali is worshipped through the night.',
      'Aripan at the threshold marks the house as prepared and protected — a Maithil signature of the season.',
    ],
    rituals: [
      {
        when: 'Day 1',
        title: 'Dhanteras',
        body: 'Metal, utensils or ornaments are bought, and the first lamps of the season are lit. Cleaning and whitewashing finish across the house.',
      },
      {
        when: 'Day 2',
        title: 'Chhoti Diwali',
        body: 'An oil bath before dawn, a few lamps at dusk, and in many Maithil homes yama-deep — a lamp set facing south for the ancestors.',
      },
      {
        when: 'Day 3',
        title: 'Diwali — Lakshmi Puja and Kali Puja',
        body: 'Aripan is drawn at the threshold and shrine. Lakshmi and Ganesh are worshipped at dusk and lamps are set along every wall, well and doorway. Through the night, Kali Puja is kept at home and in the pandals.',
      },
      {
        when: 'Day 4',
        title: 'Govardhan and Annakut',
        body: 'A mound of food is offered in gratitude for the harvest; cattle are washed, decorated and fed first.',
      },
      {
        when: 'Day 5',
        title: 'Bhai Dooj',
        body: 'Sisters mark their brothers’ foreheads and pray for their long life; brothers give a gift and take the blessing of the elder women.',
      },
    ],
    mithilaConnection: [
      'Kali Puja on Diwali night is Mithila’s own emphasis, and one of the clearest markers of the region’s Shakta character.',
      'Aripan — rice-paste floor drawing — is a distinctly Maithil ritual art, and Diwali is its most elaborate outing of the year.',
      'The lamps are read as a welcome to a returning couple, one of whom is the region’s daughter.',
      'Batasha, khaja, thekua, laddu and murki are the Maithil Diwali sweets, mostly made at home.',
    ],
    songs: [
      {
        title: 'Aai Chai Diyabati',
        titleDeva: 'आई छई दियाबाती',
        artist: 'Rashmi',
        note: 'A Maithili Diwali geet for the evening the lamps go out along every wall.',
        youtubeId: 'WblPBZrPYkQ',
      },
      {
        title: 'Lakshmi Mata Bhajan',
        titleDeva: 'लक्ष्मी माता भजन',
        artist: 'Rambabu Jha',
        note: 'Invocation of Lakshmi, sung at the dusk puja.',
        youtubeId: 'MmmDGScP3DI',
      },
      {
        title: 'Diwali Chail Aleye',
        titleDeva: 'दिवाली चैल अलिये',
        artist: 'Sannu Kumar',
        note: 'A contemporary Maithili Diwali song, widely played across the Mithila belt.',
        youtubeId: 'LEetquV4COw',
      },
    ],
    related: ['kojagara', 'durga-puja', 'chhath-puja'],
    seo: {
      title: 'Diwali & Kali Puja in Mithila — Aripan, Rituals, Five Days & Songs',
      description:
        'How Mithila keeps Diwali: aripan drawn in rice paste at the threshold, Lakshmi Puja at dusk and Kali Puja through the Kartik Amavasya night, across all five days from Dhanteras to Bhai Dooj.',
      keywords: [
        'Diwali Mithila', 'Kali Puja Mithila', 'aripan', 'Maithili Diwali geet',
        'Diwali rituals Bihar', 'Dhanteras', 'Bhai Dooj', 'Kartik Amavasya',
        'Mithila painting aripan',
      ],
    },
  },

  // ─────────────────────────────────────────────────────── Madhushravani
  {
    slug: 'madhushravani',
    name: 'Madhushravani',
    nameDeva: 'मधुश्रावणी',
    tagline: 'A fortnight of stories for a bride in her first year of marriage',
    season: 'Shravan · July–August',
    duration: 'Thirteen to fourteen days',
    uniquelyMithila: true,
    motif: 'vine',
    palette: { from: '#3E7C4A', to: '#1F5133', accent: '#E8912A' },
    intro:
      'Found only in Mithila — a fortnight-long observance kept by a woman in the first Shravan after her marriage, spent at her mother’s home listening to stories.',
    story: [
      'Madhushravani belongs to the newly married Maithil woman. In the first Shravan following her wedding she returns to her natal home and keeps a thirteen-to-fourteen day observance for the wellbeing and long life of her husband.',
      'The daily rhythm is unusual and lovely. Each morning she and the women of the household gather flowers and leaves for the puja. Then an older woman — often an aunt or a neighbour who holds the repertoire — narrates the day’s katha. The stories are of Gauri and Shiva, of the Naag or serpent deities, of Vishahara and Bihula. Over the fortnight they build into a curriculum: on marriage, endurance, danger, loyalty, and a woman’s place in a new household.',
      'The observance closes with Temi Dagana, the most talked-about of Maithil rituals. Lit cotton wicks are placed briefly on the bride’s knees. She is meant to bear it without flinching; the mark left behind is read as a blessing on the marriage’s endurance. Families vary in how literally they keep it, and many now keep it in a gentler, largely symbolic form.',
    ],
    significance: [
      'Marks a woman’s first year of marriage with a fortnight of attention that belongs entirely to her.',
      'Transmits Maithil marriage lore from older women to a new bride, through story rather than instruction.',
      'Honours the Naag and Vishahara traditions — serpent worship is a distinct strand of Mithila’s religious life.',
      'Keeps the bride at her natal home for a fortnight, easing the transition after the wedding.',
    ],
    rituals: [
      {
        when: 'Each morning',
        title: 'Gathering flowers',
        body: 'The bride and the household’s women collect fresh flowers and leaves at first light for the day’s worship — a different set is required as the days progress.',
      },
      {
        when: 'Each day',
        title: 'Gauri and Naag puja',
        body: 'Worship of Gauri, and of the serpent deities including Vishahara, with offerings of milk, flowers, sindoor and specially prepared food.',
      },
      {
        when: 'Each day',
        title: 'The katha',
        body: 'An older woman narrates the day’s story — Gauri and Shiva, the Naag cycle, Bihula and Vishahari. The bride listens fasting; the other women respond and sing between episodes.',
      },
      {
        when: 'Throughout',
        title: 'Saree, jewellery and diet',
        body: 'The bride wears clothing sent from her marital home and keeps a restricted sattvic diet, eating once a day, avoiding salt on certain days.',
      },
      {
        when: 'Final day',
        title: 'Temi Dagana',
        body: 'Lit wicks are briefly applied to the knees, borne without flinching, and read as a blessing on the marriage’s endurance. Many families now keep this in a symbolic form. The fortnight closes with a feast and gifts from both households.',
      },
    ],
    mithilaConnection: [
      'Madhushravani is observed in the Maithili-speaking region and essentially nowhere else — no other Indian tradition has quite this observance.',
      'It is one of the few festivals whose entire content — stories, songs, ritual sequence — is held and transmitted by women.',
      'The Naag and Vishahara stories connect it to Mithila’s serpent-worship tradition and to the Bihula-Vishahari epic of the wider Anga-Mithila belt.',
      'The songs are Maithili and specific to the fortnight; they are not sung at any other time of year.',
    ],
    songs: [
      {
        title: 'Saanjhak Geet',
        titleDeva: 'साँझक गीत',
        artist: 'Anupama Choudhary',
        note: 'The evening geet of the Madhushravani fortnight — sung after the day’s katha.',
        youtubeId: 'yQhXU2GzqGg',
      },
      {
        title: 'Phool Lodhay Mein Lage Sohan',
        titleDeva: 'फूल लोढ़य में लगे सोहन',
        artist: 'Sangita & Priyanka',
        note: 'Sung while the women gather flowers at first light for the day’s worship.',
        youtubeId: 'mWYSmibn6UA',
      },
      {
        title: 'Pabain Ke Geet',
        titleDeva: 'पाबैन के गीत',
        artist: 'Maithili Geet Maala',
        note: 'Traditional pabain songs of the fortnight, in the Mithilanchal style.',
        youtubeId: 'jFtJJrzJTtA',
      },
      {
        title: 'Madhushravani Pabain Geet',
        titleDeva: 'मधुश्रावणी पाबैन गीत',
        artist: 'Maithili traditional',
        note: 'A further set from the fortnight’s repertoire, including Vishahari geet.',
        youtubeId: 'TJhNbGUc6rQ',
      },
    ],
    related: ['vivah-panchami', 'kojagara', 'sama-chakeva'],
    seo: {
      title: 'Madhushravani — Mithila’s Fortnight Festival for a New Bride',
      description:
        'Madhushravani is kept only in Mithila, by a woman in her first Shravan after marriage: daily Gauri and Naag puja, a fortnight of katha and Maithili songs, and the closing Temi Dagana ritual.',
      keywords: [
        'Madhushravani', 'Madhushravani festival', 'Mithila festival newly married',
        'Temi Dagana', 'Maithili Madhushravani geet', 'Bihula Vishahari',
        'Naag puja Mithila', 'Shravan Mithila', 'Maithil bride festival',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────── Kojagara
  {
    slug: 'kojagara',
    name: 'Kojagara',
    nameDeva: 'कोजागरा',
    tagline: 'Who is awake? A moonlit night for the new son-in-law',
    season: 'Ashwin Purnima · September–October',
    duration: 'One night',
    uniquelyMithila: true,
    motif: 'moon',
    palette: { from: '#2E3A6E', to: '#1F5133', accent: '#E4C572' },
    intro:
      'On the brightest full moon of the year, Mithila keeps a festival for the newly married groom — makhan, paan, card games, and a household that stays awake until morning.',
    story: [
      'Kojagara takes its name from a question: ko jagarti — who is awake? Lakshmi is said to move across the world on Sharad Purnima night asking it, and to bless the households she finds still awake. So nobody sleeps.',
      'In Mithila the night has a second, very specific character: it belongs to the newly married man. In the first Kojagara after the wedding, the bride’s family sends bhar to the groom’s house — a substantial gift of makhan (fox nuts, grown in Mithila’s ponds), batasha, paan, sweets, fruit, clothing and often ornaments.',
      'The groom is formally honoured and receives blessings, the makhan and paan are distributed to everyone who comes, and then the household settles in to stay awake — chaupar, cards, conversation, and kheer left out in the moonlight, since Sharad Purnima moonlight is held to have a cooling, healing quality.',
    ],
    significance: [
      'Lakshmi is believed to bless those awake on Sharad Purnima — hence the night-long vigil.',
      'In Mithila the first Kojagara after a wedding formally honours the new son-in-law and binds the two families.',
      'Makhan, Mithila’s own crop, is the festival’s signature offering and gift.',
      'Sharad Purnima moonlight is considered medicinal; kheer is placed under it and eaten at night.',
    ],
    rituals: [
      {
        title: 'Bhar from the bride’s family',
        body: 'The bride’s household sends a ceremonial consignment to the groom’s home — makhan, batasha, paan, sweets, fruit, clothes and often jewellery. Its arrival is a public event.',
      },
      {
        title: 'Honouring the groom',
        body: 'The new son-in-law is seated, marked with tika, given new clothes and blessed by the elders of both families. In many households this is his formal reception into the family.',
      },
      {
        title: 'Makhan and paan',
        body: 'Fox nuts and paan are distributed to everyone present and sent to neighbours and relatives — the most recognisable gesture of the night.',
      },
      {
        title: 'Lakshmi Puja and the vigil',
        body: 'Lakshmi is worshipped, then the family stays awake — chaupar, cards, singing, talk. Kheer is left in the moonlight and eaten late.',
      },
    ],
    mithilaConnection: [
      'Kojagara as a festival for the newly married groom is specific to Mithila; elsewhere Sharad Purnima has no such focus.',
      'Makhan is grown in Mithila’s ponds and wetlands — the region supplies most of India’s crop, and the festival makes it ceremonial.',
      'The bhar is a formal statement of regard between two families in the wedding’s first year, and its composition is remembered for decades.',
      'It closes the Ashwin cycle that begins with Durga Puja, and opens the Kartik run of Diwali, Chhath and Sama Chakeva.',
    ],
    songs: [
      {
        title: 'Bantab Paan Makhaan',
        titleDeva: 'बाँटब पान मखान',
        artist: 'Shobha Bharti',
        note: 'The song of the night — makhan and paan being distributed to everyone who comes.',
        youtubeId: 'jqT-CjhkTkY',
      },
      {
        title: 'Maithili Kojagra Geet',
        titleDeva: 'मैथिली कोजगरा गीत',
        artist: 'Dilip Darbhangiya & Rani Jha',
        note: 'Traditional Kojagara songs sung as the bhar arrives and the groom is honoured.',
        youtubeId: 'zPqi26AvW-s',
      },
      {
        title: 'Sanjh–Kobar Geet',
        titleDeva: 'साँझ संग कोबर गीत',
        artist: 'Minu Jha',
        note: 'Evening and Kohbar songs — the wedding repertoire returns on the first Kojagara.',
        youtubeId: 'RuC59f1MRiw',
      },
      {
        title: 'Purnima Ke Din',
        titleDeva: 'पूर्णिमा के दिन',
        artist: 'Dolly Singh, Mahi & Puja',
        note: 'A song for the full-moon night itself.',
        youtubeId: 'ah_NYHK0kUY',
      },
    ],
    related: ['durga-puja', 'diwali', 'madhushravani'],
    seo: {
      title: 'Kojagara — Mithila’s Sharad Purnima Festival for the New Groom',
      description:
        'Kojagara is kept on Sharad Purnima in Mithila: bhar sent from the bride’s family, makhan and paan distributed, the new son-in-law honoured, and a night-long vigil for Lakshmi.',
      keywords: [
        'Kojagara', 'Kojagara festival Mithila', 'Sharad Purnima Mithila', 'makhan festival',
        'Maithil newly married groom festival', 'Kojagara geet', 'bhar Mithila',
        'Ashwin Purnima', 'Mithila festival',
      ],
    },
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

export const FESTIVAL_SLUGS = FESTIVALS.map((f) => f.slug)

export function getFestival(slug: string): Festival | undefined {
  return FESTIVALS.find((f) => f.slug === slug)
}

export function getRelatedFestivals(festival: Festival): Festival[] {
  return festival.related
    .map((slug) => getFestival(slug))
    .filter((f): f is Festival => Boolean(f))
}

/** Festivals that have at least one playable recording. */
export function festivalsWithSongs(): Festival[] {
  return FESTIVALS.filter((f) => f.songs.length > 0)
}

/** Total number of playable recordings across all festivals. */
export function totalSongCount(): number {
  return FESTIVALS.reduce((n, f) => n + f.songs.length, 0)
}

// NOTE: the embed URL is built inside components/music/PersistentPlayer.tsx,
// because it needs `enablejsapi=1` (so the YouTube IFrame Player API can be
// attached) plus the runtime `origin`. youtubeId is metadata only and is never
// used as a navigation target.
