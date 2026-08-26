-- ============================================================
-- Migration: 20260826000001_blog_marriage_rituals.sql
-- 1. Rename category: Mithila Marriage & Traditions
--    → Mithila Marriage Rituals & Traditions (slug unchanged)
-- 2. Insert 10 new articles on Maithil wedding rituals
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Category rename (slug stays mithila-marriage-traditions)
-- ────────────────────────────────────────────────────────────

UPDATE blog_categories SET
  name            = 'Mithila Marriage Rituals & Traditions',
  seo_title       = 'Mithila Marriage Rituals & Traditions | Mithila Jodi',
  seo_description = 'Explore the complete rituals and traditions of a traditional Maithil wedding — from Siddhant and Tilak to Kohbar, Sindoor Daan, Chaturthi and Dwiragaman.'
WHERE slug = 'mithila-marriage-traditions';

-- ────────────────────────────────────────────────────────────
-- 2. New articles
-- ────────────────────────────────────────────────────────────

-- ── Article A: Complete Guide to Maithil Vivah (CORNERSTONE) ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Complete Guide to Maithil Vivah: Rituals, Ceremonies and Traditions',
  'complete-guide-maithil-vivah',
  'A Maithil wedding unfolds across several days and is filled with rituals unique to the Mithila tradition. This complete guide walks you through every stage — from the first formal meeting to Dwiragaman.',
  $$
## What Is Maithil Vivah?

A Maithil wedding is one of India's most distinctive marriage traditions. It unfolds over several days, involves the full participation of both families, and includes ceremonies that are often unique to the Mithila region — rituals a visitor familiar with other Hindu weddings might not recognise at all.

*Vivah* means marriage in Sanskrit. In Mithila tradition, the term refers to the entire ceremonial journey — not just the wedding day, but the sequence of rituals that begins with the families' formal agreement and ends with the couple settling into their shared life.

Before going further, one important note: Maithil wedding customs are not uniform. Practices differ between Maithil Brahmin, Kayastha and other communities within the Mithila region, and between families of different villages, generations and personal traditions. What follows describes widely observed customs, not a single fixed rulebook.

## Phase One: Before the Wedding

### Matching the Families

Before any ceremony begins, families exchange background information. The [gotra, mool and gram](/blogs/gotra-family-lineage/mithila-family-lineage) of both families are shared — the three traditional markers of lineage in Mithila — to confirm no close-kin connection exists. Many families also compare horoscopes at this stage, looking at the [rashi (moon sign)](/blogs/horoscope-marriage/what-is-rashi) and [nakshatra (birth star)](/blogs/horoscope-marriage/what-is-nakshatra) of both individuals.

### The Siddhant Ceremony

Once the initial checks are complete and both families are satisfied, the [Siddhant ceremony](/blogs/mithila-marriage-traditions/siddhant-ceremony-mithila-marriage) takes place. This is the formal, priest-witnessed confirmation of the match — the point at which a private family understanding becomes a sanctioned commitment. Both families gather, lineage details are formally recorded, and the decision is ritually blessed by the family purohit.

### The Tilak Ceremony

After Siddhant, the formal public engagement follows. The [Tilak ceremony](/blogs/mithila-marriage-traditions/tilak-ceremony-maithil-marriage) is when representatives of the bride's family visit the groom's home, apply an auspicious mark to the groom's forehead, exchange gifts, and publicly declare the match. Tilak is a social declaration: the wider family and community now know the match has been decided.

### Lagan: Setting the Wedding Date

With the engagement formalised, the family priest selects an auspicious wedding date based on the [Hindu almanac (panchang)](/blogs/horoscope-marriage/kundli-matching-explained) and the couple's birth details. The confirmed date is shared in the lagan — the formal written invitation. Preparations then begin in earnest on both sides.

## Phase Two: Pre-Wedding Rituals

### Naina Jogin

In many Maithil families, the days before the wedding are marked by protective rituals. The [Naina Jogin](/blogs/mithila-marriage-traditions/naina-jogin-maithil-wedding) tradition involves prayers and offerings at a local deity's shrine, seeking blessings and protection for the couple as they step into the threshold of marriage. Practices here vary considerably between families.

### Music Throughout

From the moment preparations begin, [Maithili wedding songs](/blogs/mithila-marriage-traditions/maithili-wedding-songs-sohar-geet) fill the household. Women of the family gather to sing — sohar songs, geet, and other traditional compositions in the Maithili language. These are not background music; they are participatory rituals, marking each stage of the wedding with the community's voice.

## Phase Three: The Wedding Day

### Parichhan: Welcome of the Groom

When the groom's baraat (wedding party) arrives at the bride's home or wedding venue, the formal welcome takes place. [Parichhan](/blogs/mithila-marriage-traditions/parichhan-maithil-wedding) is the ritual reception of the groom by the women of the bride's family — with arati (lamp ritual), an auspicious tika, offerings, and songs. It is a warm and musically rich welcome, and one of the most distinctively Maithil moments of the wedding day.

### The Vivah Ceremony

The core wedding ceremony is conducted by the family purohit with Sanskrit mantras and Maithili prayers. The main elements include:

**Madhuparka** — the formal reception of the groom by the bride's father with an offering of honey, curd and other sacred substances. This ancient Vedic ritual honours the groom as the family's future son-in-law.

**Kanyadan** — the giving of the bride by her parents. The bride's hand is placed in the groom's by her father, accompanied by mantras and offerings into the sacred fire. For many families, this is the most emotionally significant moment of the entire ceremony.

**Saat Phere** — the bride and groom take seven rounds around the sacred fire, each accompanied by specific vows related to different aspects of their shared life — sustenance, strength, prosperity, happiness, family, companionship and lifelong commitment.

**[Sindoor Daan](/blogs/mithila-marriage-traditions/sindoor-daan-maithil-marriage)** — after completing the pheras, the groom applies sindoor (vermilion) to the bride's maang (the parting of her hair). This is the most visible moment of the marriage ritual and, in Mithila tradition, is accompanied by its own prayers and significance.

### The Kohbar Ghar

After the main ceremony, the couple comes together in the [Kohbar Ghar](/blogs/mithila-marriage-traditions/kohbar-kohbar-ghar-mithila-marriage) — a room specially prepared with Madhubani paintings. Senior women of the bride's family create these paintings: fish, lotus, bamboo, peacocks, sun and moon — each symbol carrying meaning related to fertility, prosperity and the new union. The couple's time in the Kohbar Ghar is accompanied by songs and rituals, and is one of the most intimate and visually distinctive elements of a traditional Maithil wedding.

### Vidai: The Farewell

The Vidai (farewell of the bride from her natal home) brings together all the emotion of the occasion. Songs are sung, blessings are given, and the bride departs for her new life. The departure is witnessed by the full gathering of family and accompanied by the women's songs that have marked every stage of the journey.

## Phase Four: After the Wedding

### Chaturthi

The [Chaturthi ceremony](/blogs/mithila-marriage-traditions/chaturthi-mithila-marriage) takes place on the fourth day after the wedding. It is a post-wedding ritual unique to the Maithil tradition — involving puja performed jointly by the couple, family gatherings, songs and the formal marking of the couple's settling into their new shared life. Chaturthi is considered an integral part of the marriage, not an optional add-on.

### Dwiragaman: The Second Departure

[Dwiragaman](/blogs/mithila-marriage-traditions/dwiragaman-mithila-marriage) — literally "second going" — is the final ritual of the Maithil marriage journey. The bride returns to her natal home for a ceremonial visit, and then departs again — this time more permanently — for her marital home. Dwiragaman closes the wedding process with its own rituals and songs, providing a graceful, blessed conclusion to the entire journey.

## Music and Art as Ritual

What runs through every phase of a Maithil wedding — before, during and after — is music and art. [Maithili wedding songs](/blogs/mithila-marriage-traditions/maithili-wedding-songs-sohar-geet) are not a feature of the reception; they are the community's ritual participation in every stage of the ceremony. The women who sing these songs — sohar, Kohbar geet, Vidai geet, Dwiragaman geet — are performing an act of community that is as important as any Sanskrit ritual.

[Madhubani painting](/blogs/mithila-culture-heritage/mithila-heritage) appears most prominently in the Kohbar Ghar, but its motifs and visual language run through the entire wedding: decorations, invitation designs, fabric and ceremonial objects all carry the distinctive imagery of Mithila culture.

## How Customs Vary

No single description of a Maithil wedding applies universally. Different families, sub-communities and regions within the Mithila belt observe these rituals in different forms. Some ceremonies may be shortened for a city wedding; others observed in full traditional form even in modern settings. What typically persists across all of these variations is the spirit — family participation, the Maithili language, music, and the sincerity of the rituals — even as specific details evolve.

If you are preparing for a Maithil wedding, the most authoritative guide is always your family's purohit and your own family elders, who will know the specific traditions that belong to your family and community.

## Frequently Asked Questions

**What is the first ritual in a Maithil wedding?**
The process begins before any formal ceremony, with families exchanging gotra, mool and gram details and horoscopes. The first formal ceremony is typically the Siddhant — the priest-witnessed confirmation of the match — followed by the Tilak engagement.

**How many days does a traditional Maithil wedding last?**
Traditionally, several days — often five or more when you count from the Tilak through the post-wedding Dwiragaman. The exact length varies by family and practical circumstances.

**What makes Maithil vivah different from other Hindu weddings?**
Several rituals are specific to the Mithila tradition — most notably the Kohbar Ghar, Siddhant, Chaturthi and Dwiragaman. The use of Maithili language throughout ceremonies, the prominence of women's ritual songs (sohar and geet), and the role of Madhubani art in the wedding setting are also distinctively Maithil.

**Do all Mithila families follow the same sequence of rituals?**
No. Customs vary between communities, regions and individual families. This guide describes widely observed practices; your family purohit and elders are the authoritative source for your specific tradition.

**Where can I read more about individual rituals?**
Each ceremony in this guide has its own dedicated article — use the links throughout this page to go deeper into any specific ritual that interests you.
$$,
  'Mithila Jodi Team',
  'Complete Guide to Maithil Vivah: Rituals, Ceremonies and Traditions | Mithila Jodi',
  'A complete guide to traditional Maithil vivah — from Siddhant and Tilak through the wedding ceremony, Kohbar Ghar, Sindoor Daan, Chaturthi and Dwiragaman. Understand every stage of the Maithil marriage journey.',
  ARRAY['maithil vivah', 'mithila wedding guide', 'maithil wedding rituals', 'mithila marriage complete guide', 'maithil vivah traditions', 'mithila wedding ceremony'],
  'published',
  true,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';


-- ── Article B: Kohbar and Kohbar Ghar ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Kohbar in Mithila Marriage? The Tradition of the Kohbar Ghar',
  'kohbar-kohbar-ghar-mithila-marriage',
  'The Kohbar Ghar is the sacred room at the heart of a traditional Maithil wedding — decorated with Madhubani paintings full of symbolic meaning. Learn what Kohbar is, what its paintings mean, and how this tradition is observed today.',
  $$
## What Is Kohbar?

In traditional Mithila weddings, one of the most beautiful and culturally distinctive moments involves a room — a specially prepared, painted, song-filled space set aside for the newly married couple. This room is called the **Kohbar Ghar**, and the ritual paintings created for it are called **Kohbar**.

The word *kohbar* refers specifically to the auspicious Madhubani paintings created in connection with marriage. By extension, *Kohbar Ghar* (Kohbar room) means the room in the bride's household that is decorated with these paintings and prepared as a sacred space for the new couple.

Kohbar is not decoration in the ordinary sense. Every motif in the paintings carries a specific meaning, and the act of creating them is itself a ritual. The Kohbar Ghar is one of the most distinctively Maithil elements of the wedding — a visual and spiritual blessing for the couple's new life.

## What Is the Kohbar Ghar?

The Kohbar Ghar is a room — traditionally in the bride's home — set apart from the main wedding ceremonies and specially prepared for the newly married couple. It is the space they will come to together after the main ceremony, and its decoration is understood as the women's greatest gift to the new couple.

In traditional village settings, the paintings were made directly on the mud-plastered walls using natural colours derived from plants, turmeric, soot, rice paste and other materials. The preparation of this room would begin in the days before the wedding, with the women of the household gathering to create the artwork together.

Today, the Kohbar Ghar takes many forms. In some families, the traditional hand-painted approach continues. In others, the paintings are made on cloth, paper or canvas that is then hung in the room. In city weddings, fabric panels with Kohbar motifs may decorate a specially arranged space. However the tradition is expressed, the Kohbar Ghar is recognised as an essential part of a traditional Maithil wedding.

## The Paintings and Their Symbolism

The imagery in Kohbar paintings is specific and meaningful. Each motif is chosen for its auspicious associations with marriage, fertility, prosperity and the new life the couple is beginning.

**Fish (matsya)** — The fish is among the most beloved motifs in Kohbar art. In Mithila tradition, fish represent good fortune, fertility and abundance. A pair of fish is often used, representing the couple and the harmony of their union.

**Lotus (kamal)** — The lotus represents purity, spiritual awakening and new beginnings. In the Kohbar, it expresses the purity of the new relationship and the blossoming of a new chapter.

**Bamboo (baans)** — Bamboo grows in clusters and renews itself continuously — in Mithila tradition it is associated with family growth, fertility and resilience. Its presence in the Kohbar is a wish for children and a flourishing household.

**Peacock (mor)** — Associated with beauty, dignity and grace, the peacock in Kohbar art often represents the bride and the joy and celebration of the occasion.

**Sun and Moon** — These cosmic symbols represent permanence. The marriage bond, like the sun and moon, is meant to endure.

**Parrots** — Depicted in pairs, parrots represent the couple themselves — their companionship, their closeness, and the new partnership they are beginning.

**Snake (naag)** — In some Kohbar traditions, the snake appears as a symbol of protection and of the home's guardians. It is a reminder that the sacred and the everyday are woven together.

The arrangement of these motifs, and others, varies between artists and families. There is no single correct Kohbar painting — the tradition offers a vocabulary of symbols, not a prescribed formula. Each woman brings her own skill and creativity to the work within that vocabulary.

## Who Prepares the Kohbar Ghar?

The preparation of the Kohbar Ghar is traditionally the work of women — the mothers, aunts, grandmothers and female relatives of the bride's household. Senior women who are skilled in Madhubani painting take the lead, with younger women participating, assisting and learning.

In communities with a strong tradition of Madhubani art, the painting is often done by family women directly. In other settings, a woman from the village known for her skill may be invited to create the paintings. Today, particularly for city weddings, professional Madhubani artists are sometimes engaged to create the Kohbar paintings, ensuring the tradition is observed beautifully even where the family may not include someone trained in the art.

For more on the broader tradition of Madhubani painting and its place in Mithila heritage, see [Understanding Mithila Heritage](/blogs/mithila-culture-heritage/mithila-heritage).

## Songs and Ritual in the Kohbar Ghar

The preparation of the Kohbar Ghar is never done in silence. Women gather and sing [Maithili wedding songs](/blogs/mithila-marriage-traditions/maithili-wedding-songs-sohar-geet) as they work. The act of creating the Kohbar space is a communal, celebratory ritual — the women are not just painting walls, they are weaving blessings into the room for the couple.

When the newly married couple comes to the Kohbar Ghar together after the main ceremony, there are specific *Kohbar geet* (Kohbar songs) sung for this moment. The gathering of women outside the room, singing songs of blessing and joy, is one of the warmest and most human moments of the whole wedding.

In some families, there is a playful custom where the groom must negotiate good-naturedly with the bride's younger siblings or cousins before being allowed to enter the Kohbar Ghar — a moment of lightness and laughter in the midst of a long and serious ceremonial day.

## What Happens in the Kohbar Ghar?

After the main wedding ceremony, the couple comes to the Kohbar Ghar. This is traditionally the first semi-private time they share as a married couple. Specific rituals are observed inside the room — the details vary by family. The painted walls surround them, the songs have been sung, and the couple sits together in a space specifically created to welcome them.

The moment carries both sacred and personal significance. The Kohbar Ghar is not just a decorated room — it is the threshold of their new life together, marked with the community's most meaningful symbols and filled with the love and effort of the women who prepared it.

## The Kohbar Tradition Today

In contemporary Maithil weddings, whether held in ancestral villages, city homes or hotel banquet halls, the Kohbar tradition survives in various forms. The underlying spirit — a beautifully prepared, symbolically meaningful space to welcome the couple — is preserved even as the specific form adapts to circumstances.

The Kohbar is also one of the most photographed elements of a modern Mithila wedding, and for good reason. The combination of intricate Madhubani art, the warmth of gathered family, and the significance of the moment creates something visually and emotionally memorable.

For the full context of how Kohbar fits into the Maithil marriage journey, see the [Complete Guide to Maithil Vivah](/blogs/mithila-marriage-traditions/complete-guide-maithil-vivah).

## Frequently Asked Questions

**What is Kohbar in Mithila marriage?**
Kohbar refers to the traditional Madhubani paintings created specifically for a Mithila wedding, and by extension to the room (Kohbar Ghar) decorated with these paintings for the newly married couple.

**What do the paintings in the Kohbar Ghar represent?**
Common motifs include fish (fertility and good fortune), lotus (purity and new beginnings), bamboo (family growth), peacock (beauty and celebration), sun and moon (permanence), and paired parrots (the couple). Each carries a specific symbolic meaning related to the couple's new life.

**Who creates the Kohbar paintings?**
Traditionally, the women of the bride's family — particularly senior women skilled in Madhubani art. Today, professional Madhubani artists are sometimes engaged, especially for weddings where the family does not include someone trained in the art form.

**Is the Kohbar Ghar observed in all Mithila weddings?**
Kohbar is a distinctive part of traditional Maithil weddings and is observed by many families, though the specific form varies. Some maintain the full tradition with hand-painted walls; others adapt it for modern settings.
$$,
  'Mithila Jodi Team',
  'What Is Kohbar in Mithila Marriage? The Tradition of Kohbar Ghar | Mithila Jodi',
  'Discover what Kohbar means in Mithila marriage, the symbolism behind Kohbar Ghar paintings — fish, lotus, bamboo and more — and how this Madhubani art tradition is observed in Maithil weddings today.',
  ARRAY['kohbar mithila marriage', 'kohbar ghar', 'kohbar tradition', 'maithil wedding kohbar', 'kohbar painting mithila', 'mithila wedding traditions'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';


-- ── Article C: Tilak Ceremony ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Tilak Ceremony in Maithil Marriage: What Happens and Why It Matters',
  'tilak-ceremony-maithil-marriage',
  'The Tilak ceremony is the formal engagement in a Maithil wedding — when the bride''s family visits the groom''s home and publicly declares the match. Learn what happens, who participates and what it signifies.',
  $$
## What Is the Tilak Ceremony?

In Maithil tradition, the Tilak ceremony is the formal engagement — the moment when a matrimonial match moves from private family agreement to public, social commitment. The bride's family visits the groom's home, an auspicious mark (tilak) is applied to the groom's forehead, gifts are exchanged, and both families celebrate together.

While the word *tilak* simply means the auspicious mark itself — made from kumkum, sandalwood paste or other sacred substances — in the context of Maithil vivah, "Tilak" refers to the complete engagement ceremony built around that central act.

For many families, Tilak is one of the most festive and joyful days of the entire wedding process. After weeks or months of discussion, matching and the quiet formalities of the [Siddhant ceremony](/blogs/mithila-marriage-traditions/siddhant-ceremony-mithila-marriage), Tilak is the occasion that feels like celebration.

## When Does Tilak Take Place?

Tilak is a pre-wedding ceremony, typically held days, weeks or months before the main wedding day. It comes after both families have completed their initial discussions and the Siddhant — the formal family agreement — has been observed.

In some families, the wedding date is fixed at or around the time of Tilak. In others, the date may already have been decided during the Siddhant stage. Either way, the Tilak marks the point at which preparations on both sides accelerate.

The full sequence in a traditional Maithil marriage: **Siddhant → Tilak → Lagan → Pre-wedding rituals → Wedding ceremonies → Chaturthi → Dwiragaman**.

## What Happens at the Tilak Ceremony?

### The Visit

The ceremony begins when a delegation from the bride's family — the bride's father, brothers, male relatives and close family friends — travels to the groom's home. The groom's household receives them warmly, and the occasion is framed from the start as a celebration, not a transaction.

### The Tilak Ritual

At the heart of the ceremony, the bride's father or a senior male relative approaches the groom and applies the tilak to his forehead. The substance used — kumkum, sandalwood paste, rice, or a combination — varies by family tradition. The application is accompanied by mantras or auspicious words. By accepting the tilak, the groom formally signals his acceptance of the match and of the bride's family's honour.

This is a simple act, but a deeply meaningful one. The bride's father is marking the groom as a chosen son-in-law — publicly investing his trust and respect in this person.

### Gifts and Exchange

The Tilak ceremony involves a meaningful exchange of gifts. The bride's family typically brings items for the groom and his household — clothing, dry fruits, sweets, traditional items and often money. The specific gifts are not prescribed by ritual; they reflect the family's tradition, capacity and the warmth of the relationship being formed.

The groom's family reciprocates with gifts and hospitality. Both sides are careful to ensure the occasion is generous and celebratory.

### Sweets and Songs

Sweets — traditionally laddoo or modak — are distributed among all present. In many families, the women of the groom's household sing auspicious Maithili songs to mark the occasion. The gathering has a festive character, and by the end of the day both families typically feel more like family than strangers.

## Who Attends the Tilak Ceremony?

Tilak is primarily attended by the families' senior members and close relatives. On the bride's side, the father and brothers play the most prominent role in the formal ritual. On the groom's side, the groom's father, uncles and senior family members receive the guests.

Depending on the family's style and scale, the occasion may be a small, intimate gathering or a larger celebration with extended family and close friends. In modern practice, the bride and groom may also be present, and some families use the occasion as an opportunity for the two to meet informally if they have not done so before.

## What Does Tilak Signify?

**Public commitment:** Before Tilak, the match is a private family matter. After Tilak, it is known to the extended family and community. Both sides have made a visible social commitment that carries its own weight and gravity.

**Honouring the groom:** The act of applying tilak is an act of honour and respect. The bride's family is acknowledging the groom as a worthy match — and by doing so publicly, they place their own reputation behind the relationship.

**Sealing the bond between families:** In Mithila understanding, the Tilak creates a bond of responsibility between the two families. Both sides are now committed — not just to the marriage, but to the relationship between the families themselves.

## Tilak and Siddhant: Understanding the Difference

Families unfamiliar with the Maithil tradition sometimes conflate Tilak and Siddhant, but they are distinct ceremonies:

| | Siddhant | Tilak |
|---|---|---|
| Character | Private, ritual, priest-guided | Public, festive, family-led |
| Primary purpose | Formal confirmation of match | Public engagement declaration |
| Who leads | Family purohit | Bride's father / senior male relatives |
| Mood | Careful and solemn | Joyful and celebratory |

Siddhant is the quiet confirmation; Tilak is the joyful declaration. Both matter.

## The Tilak Ceremony Today

Today, Tilak ceremonies range from intimate family gatherings to larger celebrations with extended family and friends. Some families combine Tilak with a formal dinner; others keep it focused on the ritual and close relatives. The essential elements — the visit, the tilak mark, the gifts, the mutual celebration — remain consistent across these variations.

In some cities and among diaspora Mithila families, Tilak may be combined with or resemble what other communities call a roka or mangni. But in its Maithil form, Tilak has its own specific character and ritual that distinguishes it.

For the complete picture of how Tilak fits into the Maithil marriage journey, see the [Complete Guide to Maithil Vivah](/blogs/mithila-marriage-traditions/complete-guide-maithil-vivah).

## Frequently Asked Questions

**What is Tilak in Maithil marriage?**
Tilak is the formal engagement ceremony in which the bride's family visits the groom's home, applies an auspicious mark to the groom's forehead, and publicly declares the match. It is a joyful, social occasion that makes the engagement known to the wider family and community.

**Who applies the tilak to the groom?**
The bride's father or a senior male relative of the bride performs this ritual.

**What gifts are given at the Tilak ceremony?**
The bride's family typically brings clothing, sweets, dry fruits and other items for the groom and his household. The specific gifts vary by family tradition and capacity.

**What is the difference between Tilak and Siddhant in Mithila?**
Siddhant is the earlier, more private family meeting where the match is formally confirmed with the family purohit. Tilak is the public, celebratory engagement ceremony that follows.

**Does the bride attend the Tilak ceremony?**
Practices vary. In more traditional settings, the ceremony is primarily between the male representatives of both families. In modern practice, both the bride and groom may be present.
$$,
  'Mithila Jodi Team',
  'Tilak Ceremony in Maithil Marriage: What Happens and Why It Matters | Mithila Jodi',
  'Learn about the Tilak ceremony in Maithil marriage — the formal engagement where the bride''s family visits the groom''s home, applies the tilak mark, exchanges gifts and publicly declares the match.',
  ARRAY['tilak ceremony mithila', 'tilak maithil marriage', 'tilak ceremony mithila wedding', 'maithil engagement ceremony', 'mithila tilak tradition'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';


-- ── Article D: Siddhant Ceremony ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is the Siddhant Ceremony in Mithila Marriage?',
  'siddhant-ceremony-mithila-marriage',
  'Siddhant is the formal, priest-witnessed confirmation of a matrimonial match in Maithil tradition — the ceremony that turns a private family understanding into a sanctioned commitment. Learn what happens and why it matters.',
  $$
## What Is the Siddhant Ceremony?

In a traditional Maithil marriage, the formal process of committing to a match does not happen with a simple handshake or a phone call. It happens through a ceremony — one witnessed by the family purohit (priest), conducted with ritual care, and understood by both families as a binding step.

This ceremony is called **Siddhant**.

The word *siddhant* carries the sense of "establishment" or "confirmation" — the formal determination that something is so. In the context of Maithil vivah, Siddhant is the ceremony in which the families officially confirm their agreement to the match, verify the lineage details, and receive the purohit's ritual sanction.

Siddhant is the point at which both families cross from considering a match to being committed to it.

## When Does Siddhant Take Place?

Siddhant comes after both families have done their due diligence:

- [Gotra, mool and gram](/blogs/gotra-family-lineage/mithila-family-lineage) have been exchanged and verified
- Horoscopes have been compared, if the families observe this practice
- The families have met — formally or informally — and reached a mutual agreement
- Both sides are satisfied that the match is suitable

The Siddhant ceremony then takes this private agreement and makes it formal, ritual-sanctioned and witnessed. It typically precedes the [Tilak ceremony](/blogs/mithila-marriage-traditions/tilak-ceremony-maithil-marriage), which is the public engagement celebration.

The sequence in Maithil vivah: **Siddhant → Tilak → Lagan → Pre-wedding rituals → Wedding → Post-wedding rituals**.

## What Happens at the Siddhant Ceremony?

### The Gathering

Both families come together — at an agreed location, which may be the bride's home, the groom's home or a neutral venue. The family purohit of one or both families is present. Senior members of both families attend.

### Lineage Verification

One of the most important functions of Siddhant is the formal, priest-mediated verification of lineage. The [gotra](/blogs/gotra-family-lineage/what-is-gotra) and related details of both families are established in the presence of the purohit. This serves as the community's formal acknowledgment that no prohibited kin relationship exists between the two families, and that the match is ritually permissible.

For [gotra and marriage compatibility in the Mithila tradition](/blogs/gotra-family-lineage/gotra-marriage-compatibility), this is a critical step. The Siddhant ceremony formalises what the families have already privately determined.

In many families, the purohit makes a record of this — the names, gotras and the date of the agreement may be noted in the family's ritual register (*bahikhata*). This creates a community record of the commitment.

### The Formal Mutual Agreement

The heads of both families formally express their agreement to the match in the purohit's presence. This expression of agreement may involve the exchange of paan (betel leaf), coconut, sacred thread or other traditional items — the exact elements vary by family and community. The purohit recites appropriate mantras and performs a brief puja to bless the agreement.

The ritual acknowledgment of both families' consent, in the presence of a religious witness, gives the Siddhant its weight. This is not merely a social agreement — it is a spiritually sanctioned commitment.

### Blessings and Celebration

After the formal rituals, the occasion becomes warmer. Sweets are distributed, blessings are exchanged, and both families spend time together. The initial stiffness of a formal meeting gives way to something more relaxed and joyful as both sides begin to relate to each other as future family.

## How Siddhant Differs from Tilak

These two ceremonies are sometimes confused, but they serve distinct purposes:

| | Siddhant | Tilak |
|---|---|---|
| Purpose | Private ritual confirmation of the match | Public celebration of the engagement |
| Who leads | Family purohit | Bride's father and male relatives |
| Tone | Formal, careful, ritual-focused | Festive, social, celebratory |
| Audience | Immediate family and purohit | Extended family and community |
| Timing | First | After Siddhant |

Think of Siddhant as the moment the families say "yes" in front of a witness, and Tilak as the moment they tell everyone else.

## Why Siddhant Matters

**Community accountability:** The presence of the purohit and senior family members as witnesses creates a shared record and shared responsibility. Both families have made a commitment that the community knows about.

**Protecting the integrity of the match:** Once Siddhant has been observed, withdrawing from a match is considered a serious matter and is treated with corresponding social weight. This is not merely social pressure — it reflects the understanding that a commitment made in this way carries genuine moral significance.

**Lineage integrity:** The formal verification of gotra and mool at Siddhant protects both families from discovering an inadvertent close-kin connection at a later stage — when it would be much more difficult to address.

**Clarity:** The Siddhant removes ambiguity. Both families now know exactly where they stand. The match is confirmed; preparations can begin.

## Siddhant Across Different Families

Like all Maithil marriage customs, Siddhant is observed differently by different families and communities. Some families conduct an elaborate Siddhant with full ritual; others observe a simpler form. In some modern families, particularly in cities, the Siddhant may be a more informal occasion, with the lineage verification and mutual agreement handled through conversation rather than elaborate ceremony.

What remains consistent is the purpose: a formal, mutually acknowledged confirmation that the match has been agreed, verified and blessed — before the more public and celebratory events begin.

For the full context of how Siddhant fits into the Maithil marriage journey, see the [Complete Guide to Maithil Vivah](/blogs/mithila-marriage-traditions/complete-guide-maithil-vivah).

## Frequently Asked Questions

**What is Siddhant in Mithila marriage?**
Siddhant is the formal, priest-witnessed ceremony where both families officially confirm their agreement to the marriage match. It includes lineage verification (gotra, mool, gram), a mutual declaration of commitment, and the purohit's ritual blessing.

**Is Siddhant the same as Tilak?**
No. Siddhant is the private, priest-guided confirmation of the match. Tilak is the public, celebratory engagement ceremony that follows. Both are important, and they serve different purposes.

**Does every Mithila family observe Siddhant?**
The ceremony is widely observed in various forms, but not uniformly. Some families conduct a full traditional Siddhant; others observe a simpler version. Your family purohit and elders are the best guide to your specific tradition.

**What role does the purohit play?**
The purohit acts as ritual witness, record-keeper and the source of religious sanction. They verify lineage details, recite appropriate mantras, and formally bless the families' agreement.

**What happens if families want to withdraw after Siddhant?**
Withdrawing from a match after Siddhant is considered a serious matter with social and moral implications. Families typically seek advice from elders and the purohit if they face such circumstances.
$$,
  'Mithila Jodi Team',
  'What Is the Siddhant Ceremony in Mithila Marriage? | Mithila Jodi',
  'Understand the Siddhant ceremony — the formal, priest-witnessed confirmation of a Maithil matrimonial match that verifies lineage and seals the agreement before Tilak and the wedding.',
  ARRAY['siddhant ceremony mithila', 'siddhant maithil marriage', 'mithila pre-wedding ceremony', 'maithil vivah siddhant', 'mithila wedding rituals before tilak'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';


-- ── Article E: Chaturthi ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Chaturthi in Mithila Marriage: The Fourth-Day Post-Wedding Ceremony',
  'chaturthi-mithila-marriage',
  'Chaturthi is the important fourth-day ceremony after a Maithil wedding — a ritual that marks the couple''s formal beginning of their shared life. Learn what happens, why it matters and how different families observe it.',
  $$
## What Is Chaturthi?

For many people outside the Mithila tradition, a wedding is complete when the main ceremony ends. In the Maithil understanding, it is not.

A traditional Maithil marriage continues across several days, with rituals that mark the different stages of the couple's transition into their new life. One of the most important of these post-wedding ceremonies is **Chaturthi** — observed on the fourth day after the wedding.

*Chaturthi* comes from the Sanskrit word for "fourth." In the context of Maithil vivah, it refers to the specific ceremonies and rituals that take place on the fourth day following the main wedding. For families who observe it fully, Chaturthi is considered as significant as any element of the wedding itself.

## What Happens at Chaturthi?

Chaturthi practices vary between families and communities within the Mithila tradition, but certain elements appear widely:

### Puja by the Couple

The day typically begins with puja — ritual worship — performed by the bride and groom together, often under the guidance of the family purohit. These prayers may be directed to Ganesha (for auspicious new beginnings), the family's kula devi (clan goddess), and other sacred figures relevant to the family's tradition.

The couple's joint performance of ritual worship is itself significant. At the wedding, many of the rituals are done in the presence of the extended gathering. At Chaturthi, the couple performs worship as a unit — as a new household, with their own religious life beginning.

### The Couple as a New Household

Chaturthi is sometimes understood as the formal beginning of the couple's shared domestic life. Certain rituals and tasks performed on this day — some symbolic, some practical — mark the couple's establishment as a new unit within the broader family. The bride's place in the household, which was new and uncertain on the wedding day, begins to settle at Chaturthi.

### Family Gathering

Chaturthi brings both families together again after the wedding. Relatives who were unable to stay for all of the wedding ceremonies often join on the fourth day. There is typically a shared meal, and the atmosphere is more relaxed than the wedding itself — the formal ceremonies have been completed, and both families can simply enjoy each other's company.

In many households, the women gather to sing [Maithili songs](/blogs/mithila-marriage-traditions/maithili-wedding-songs-sohar-geet) appropriate to this stage of the marriage. The music continues to mark the occasion as one worth celebrating.

### Gifts from the Bride's Family

The bride's family often presents additional gifts on Chaturthi — to the couple, and sometimes to members of the groom's household. These are separate from the wedding gifts and represent an ongoing expression of goodwill and generosity toward the new family that the bride has joined.

## The Spiritual Significance of Chaturthi

In traditional Hindu understanding of sacred time, the fourth day after a major event often carries its own ritual significance. Many important transitions are formally marked on the fourth day — it is a recognised threshold in the ritual calendar.

In the context of marriage, the fourth day represents consolidation. The wedding has been performed; the couple has spent their first days together; the initial intensity of the ceremony has settled. Chaturthi marks this settling — a formal acknowledgment that the marriage has begun, that the couple is establishing themselves, and that the families and community recognise and support this new unit.

## How Chaturthi Relates to Dwiragaman

Chaturthi is not the final post-wedding ceremony. It is followed, at some point, by [Dwiragaman](/blogs/mithila-marriage-traditions/dwiragaman-mithila-marriage) — the "second departure," which is the final ritual of the Maithil marriage journey. Together, Chaturthi and Dwiragaman form the post-wedding arc that completes the full vivah process.

The exact relationship between Chaturthi and Dwiragaman in the sequence varies by family. In some traditions, the bride's ceremonial return visit (before Dwiragaman) happens shortly after Chaturthi. In others, the sequence is somewhat different. The family purohit and elders are the guide here.

## What Makes Chaturthi Distinctive to Mithila

Chaturthi as a specifically named and observed post-wedding ceremony is one of the elements that distinguishes the Maithil wedding tradition from the general North Indian Hindu wedding template. Many Hindu weddings have post-wedding rituals, but the named, fourth-day character of Chaturthi as an integral part of the vivah process is a specifically Maithil feature.

For families who wish to observe the full depth of the Maithil tradition, Chaturthi is not optional — it is part of what a Maithil wedding is.

For the complete picture of the Maithil marriage journey, see the [Complete Guide to Maithil Vivah](/blogs/mithila-marriage-traditions/complete-guide-maithil-vivah).

## Frequently Asked Questions

**What is Chaturthi in a Mithila wedding?**
Chaturthi is the fourth-day post-wedding ceremony in the Maithil tradition. It includes joint puja by the couple, family gatherings, Maithili songs, and rituals that formally mark the couple's settling into their shared life.

**When exactly is Chaturthi observed?**
On the fourth day after the main wedding ceremony. The exact counting may vary slightly in how different families measure it, but "the fourth day" is the consistent reference.

**Is Chaturthi the same as griha pravesh?**
No. Griha pravesh (the bride's entry into the groom's home) typically happens on the wedding day or the day after. Chaturthi is a separate ceremony observed specifically on the fourth day, with its own rituals and significance in the Maithil tradition.

**Do all Mithila families observe Chaturthi?**
Chaturthi is widely recognised as part of the Maithil tradition, but the form and elaborateness of the ceremony varies by family. Some observe it fully; others observe a simpler version. Your family's purohit and elders will guide you.
$$,
  'Mithila Jodi Team',
  'Chaturthi in Mithila Marriage: The Fourth-Day Post-Wedding Ceremony | Mithila Jodi',
  'Learn about Chaturthi — the fourth-day ceremony in a Maithil wedding that marks the couple''s formal beginning of shared life through puja, family gathering and Maithili songs.',
  ARRAY['chaturthi mithila marriage', 'chaturthi maithil wedding', 'post wedding ceremony mithila', 'fourth day wedding ritual mithila', 'maithil vivah chaturthi'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';


-- ── Article F: Sindoor Daan ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Sindoor Daan in Maithil Marriage: Meaning, Ritual and Significance',
  'sindoor-daan-maithil-marriage',
  'Sindoor Daan — the groom applying vermilion to the bride''s maang — is one of the most sacred moments of a Maithil wedding. Learn when it happens, how it is performed and what it means in the Mithila tradition.',
  $$
## What Is Sindoor Daan?

Of all the moments in a Hindu wedding ceremony, few carry the visible weight of Sindoor Daan.

*Sindoor* is the red or orange-red vermilion powder that married Hindu women traditionally wear in the parting of their hair. *Daan* means giving or offering. Sindoor Daan — the groom's first application of sindoor to the bride's maang (the parting of her hair) — is the act that, in visible and undeniable terms, marks the bride as married.

In the Maithil tradition, Sindoor Daan is performed as part of the core wedding ceremony, accompanied by its own specific prayers and the gathered presence of the family. It is a moment that has stayed essentially unchanged across generations of Maithil weddings.

## When Does Sindoor Daan Take Place?

In the sequence of a Maithil wedding ceremony, Sindoor Daan takes place after the **Saat Phere** — the seven rounds taken by the bride and groom around the sacred fire, each accompanied by specific vows.

Having completed the pheras and made their vows to each other, the groom applies sindoor to the bride's maang. The ceremony moves from the ritual of commitment to the ritual of marking — the vows have been made, and now the marriage is made visible.

The exact moment within the ceremony may vary based on the purohit's guidance and family tradition, but the positioning after the pheras is widely observed.

## How Is Sindoor Daan Performed in a Maithil Wedding?

A small amount of sindoor is prepared — placed in the groom's right hand or on a small silver plate, a leaf, or a traditional offering vessel. The purohit recites the appropriate mantras, invoking blessings for the couple and the sanctity of the act.

The groom then applies the sindoor to the bride's maang with his right hand — gently and deliberately. In many Maithil families, this is done with the bride's head partially covered by her sari or dupatta, acknowledging the intimacy and sacredness of the act even in a large gathering.

The women gathered at the wedding may sing auspicious [Maithili songs](/blogs/mithila-marriage-traditions/maithili-wedding-songs-sohar-geet) at this moment — marking it with voice and music as the significant threshold it is.

## What Does Sindoor Daan Mean?

**The visible sign of marriage:** Sindoor is among the most recognisable and socially understood symbols of married status in Hindu North India. From the moment of Sindoor Daan, the bride wears this mark — and everyone who sees it understands what it means.

**A personal act between the couple:** It is specifically the groom who applies the sindoor — not the purohit, not a family member. This is a direct, personal act of acceptance and commitment. The husband takes the wife as his own, and marks this with his own hand.

**The colour of auspiciousness:** Red and orange-red have deep associations in Hindu tradition — with Shakti (divine feminine energy), with prosperity and life, with the sacred. The sindoor mark is understood as protective and life-affirming.

**The moment of full transition:** For the bride, Sindoor Daan is the moment of complete transformation. Everything before it — the preparations, the ceremonies, the Saat Phere — has been building toward this. With Sindoor Daan, she fully enters her new life.

## The Sindoor Tradition After the Wedding

After the wedding, married women in many Mithila families continue to wear sindoor as part of their daily appearance. This is a personal and cultural practice, not a religious requirement in the strict sense — and it varies between women, families and generations.

Some women wear sindoor every day; others on auspicious occasions or family gatherings; others may not continue the practice at all. All of these choices are made within the individual and family's own understanding of tradition. What is shared is the understanding that the sindoor worn in daily life is an extension of the meaning of Sindoor Daan — a continuation of the mark made at the wedding.

## Sindoor Daan Within the Full Ceremony

Sindoor Daan is one moment within the richly layered Maithil wedding ceremony. To understand it fully, it helps to understand the ritual that precedes it (the Saat Phere) and the ritual that follows (the couple's time in the [Kohbar Ghar](/blogs/mithila-marriage-traditions/kohbar-kohbar-ghar-mithila-marriage)).

Together, these three — the pheras, Sindoor Daan, and the Kohbar Ghar — form the spiritual core of the wedding day: the vows, the marking, and the sacred beginning.

For the complete sequence of the Maithil wedding ceremony, see the [Complete Guide to Maithil Vivah](/blogs/mithila-marriage-traditions/complete-guide-maithil-vivah).

## Frequently Asked Questions

**What is Sindoor Daan in Maithil marriage?**
Sindoor Daan is the ritual in which the groom applies sindoor (vermilion) to the parting of the bride's hair (maang) during the wedding ceremony, marking her as married. It takes place after the Saat Phere.

**Why does the groom apply sindoor and not the purohit?**
Sindoor Daan is specifically a personal act between the husband and wife. The purohit recites mantras to sanctify the moment, but the act of applying the sindoor belongs to the groom — it is his direct, personal acknowledgment of his wife.

**Why is sindoor applied specifically at the maang?**
The parting of the hair at the top of the head is considered a sacred point in Hindu tradition — associated with the sahasrara (crown chakra) and the seat of spiritual energy. Applying sindoor there is both a practical visible marker and a spiritually significant act.

**Does every woman in Mithila continue wearing sindoor after marriage?**
Practices vary between families and generations. Many women continue the tradition as a daily practice; others observe it selectively. It is a personal and cultural choice.
$$,
  'Mithila Jodi Team',
  'Sindoor Daan in Maithil Marriage: Meaning, Ritual and Significance | Mithila Jodi',
  'Learn about Sindoor Daan in Maithil marriage — when it happens in the ceremony, how the groom applies sindoor to the bride''s maang, and what this deeply significant ritual means in the Mithila tradition.',
  ARRAY['sindoor daan mithila', 'sindoor daan maithil marriage', 'sindoor ceremony mithila', 'sindoor daan meaning', 'mithila wedding sindoor'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';


-- ── Article G: Dwiragaman ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Dwiragaman? The Ritual That Closes the Maithil Wedding Journey',
  'dwiragaman-mithila-marriage',
  'Dwiragaman — the "second departure" — is the final post-wedding ritual in a traditional Maithil marriage. The bride returns to her natal home for a ceremonial visit, then departs again to formally begin her life in the marital home.',
  $$
## What Is Dwiragaman?

The word *Dwiragaman* comes from Sanskrit: *dwi* (two, or second) and *agaman* (arrival or departure). It means "second going" or "second departure," and in the Maithil marriage tradition it refers to a specific and meaningful post-wedding ceremony — the bride's second formal departure from her natal home.

Dwiragaman is the ritual that closes the Maithil wedding journey. Though it takes place days or weeks after the main wedding ceremony, it is understood as an essential part of the vivah — not an afterthought, but the final chapter of a story that began with the Siddhant.

## Understanding the Three Departures

To understand Dwiragaman, it helps to see it in the sequence of departures that mark a Maithil bride's transition:

**First departure — Vidai:** Immediately after the wedding ceremony, the bride leaves her natal home with the groom and the baraat. This is the emotionally charged Vidai — the farewell that is among the most moving moments of any Indian wedding. The bride departs quickly, surrounded by songs, tears and blessings.

**The return:** After a period of time — varying by family from a few days to a few weeks — the couple returns to the bride's natal home. This is a ceremonial visit: the new couple is welcomed back, both families spend time together, and the bride has a chance to be home again and feel the new shape of that relationship.

**Dwiragaman — the second departure:** When the return visit concludes, the bride departs again. This time, the departure is more permanent — she is going to build her life in the marital home. This is Dwiragaman.

## Why Dwiragaman Matters

The Vidai immediately after the wedding is sudden and overwhelming. The bride is leaving in the midst of the ceremony's intensity, surrounded by the full gathering of the day, often in tears and surrounded by tears.

Dwiragaman offers something different — a more considered farewell. The family has had time to breathe after the wedding. They have received the couple back and seen them together. The bride has had time to visit her home and her family not as a daughter who is about to leave, but as a daughter who has left and returned.

When Dwiragaman happens, the departure is no less felt — but it is more conscious. The bride chooses to leave. The family has the chance to say goodbye with the clarity that comes after the initial shock of the wedding has settled. Blessings given at this moment carry a different weight.

For many Maithil families, Dwiragaman is among the most emotionally significant moments of the entire marriage process.

## What Happens at Dwiragaman?

### The Return Visit

Before Dwiragaman itself, the couple's return visit to the natal home is itself a meaningful occasion. Both families — sometimes including the groom's close relatives — spend time together. There is a shared meal, time for conversation, and the warmth of the new bond between the families.

[Maithili wedding songs](/blogs/mithila-marriage-traditions/maithili-wedding-songs-sohar-geet) are sung by the women of the household. There are specific songs for the return visit and for the Dwiragaman itself — the women's voices mark this stage of the journey as they have marked every stage before it.

### The Ritual Farewell

When the time comes for Dwiragaman, the purohit may observe a brief puja — prayers for the couple's journey and their new life. The bride's parents and family bless her again: they touch her head, give her gifts, and say what needs to be said.

The farewell is different from the Vidai — less sudden, less overwhelmed, but no less heartfelt. The bride now leaves not into the unknown, but toward a life she has already begun.

### Arrival at the Marital Home

When the couple arrives at the groom's home after Dwiragaman, the return may be accompanied by welcoming rituals from the groom's household — marking the bride's more settled arrival. She is no longer entirely new; she has been there before, and now she is home.

## When Does Dwiragaman Take Place?

Timing varies by family. Some families observe Dwiragaman a few days after [Chaturthi](/blogs/mithila-marriage-traditions/chaturthi-mithila-marriage); others weeks after the wedding. The length of the return visit also varies. The family purohit and elders determine what is appropriate according to the family's tradition.

## How Chaturthi and Dwiragaman Relate

Chaturthi (the fourth-day ceremony) and Dwiragaman form the two main post-wedding rituals in a traditional Maithil marriage. Chaturthi marks the beginning of the couple's settled life together; Dwiragaman closes the bride's formal transition from her natal home. Together, they complete what the wedding ceremony began.

For the full sequence of Maithil marriage rituals, see the [Complete Guide to Maithil Vivah](/blogs/mithila-marriage-traditions/complete-guide-maithil-vivah).

## Dwiragaman Today

In modern practice, Dwiragaman continues to be observed in many Maithil families. The distances between families, the practical constraints of leave from work, and other modern circumstances sometimes require adaptation — a shorter return visit, or a Dwiragaman that takes place sooner than tradition might suggest.

The ritual essence is maintained: the return, the time spent together, the blessing, the second departure. Even when the form is simplified, the recognition that this is a significant moment — that the marriage process has a deliberate, ritual conclusion — is preserved.

## Frequently Asked Questions

**What is Dwiragaman in Mithila marriage?**
Dwiragaman is the post-wedding ritual in which the bride returns to her natal home for a ceremonial visit and then departs again — this time more permanently — to her marital home. It is the final ritual of the Maithil marriage process.

**When does Dwiragaman happen?**
Timing varies by family — typically a few days to a few weeks after the wedding, often following the Chaturthi ceremony. Consult your family purohit and elders for your specific tradition.

**What is the difference between Vidai and Dwiragaman?**
Vidai is the bride's immediate departure from her natal home on the wedding day. Dwiragaman is her second departure — after she has returned for a ceremonial visit and is leaving again, this time more permanently, for her marital home.

**Is Dwiragaman observed by all Mithila families?**
It is a recognised and widely observed part of the Maithil tradition, though specific forms and timing vary. It is more commonly observed in families with strong traditional practice.
$$,
  'Mithila Jodi Team',
  'What Is Dwiragaman? The Ritual That Closes the Maithil Wedding Journey | Mithila Jodi',
  'Learn about Dwiragaman — the post-wedding ritual in which the Maithil bride returns to her natal home and then departs for the last time, formally concluding the marriage process.',
  ARRAY['dwiragaman mithila marriage', 'dwiragaman maithil wedding', 'dwiragaman meaning', 'mithila post wedding rituals', 'maithil vivah dwiragaman'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';


-- ── Article H: Maithili Wedding Songs ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Maithili Wedding Songs: Sohar, Geet and the Voice of a Mithila Wedding',
  'maithili-wedding-songs-sohar-geet',
  'In a Maithil wedding, music is not decoration — it is ritual. Women sing Maithili songs at every stage of the marriage, from the tilak to the vidai. Learn about sohar, geet and the living musical tradition of the Mithila wedding.',
  $$
## Music as Ritual in a Maithil Wedding

There is a moment in most Maithil weddings when the music stops you. Not the band, not the recorded songs played over speakers — but the voices of the women of the household, gathered together, singing in Maithili.

In a traditional Maithil wedding, music is not decoration. It is ritual. The women who sing these songs are not performing for an audience — they are marking the occasion, the way mantras mark it, the way the purohit's prayers mark it. Their voices are a form of blessing.

This musical tradition — centred on sohar and other wedding songs — is one of the most distinctively Maithil elements of the wedding, and one of the most alive.

## The Role of Women's Song

Throughout the marriage journey — from the pre-wedding preparations through the [Tilak ceremony](/blogs/mithila-marriage-traditions/tilak-ceremony-maithil-marriage), the wedding ceremonies themselves, the [Kohbar Ghar](/blogs/mithila-marriage-traditions/kohbar-kohbar-ghar-mithila-marriage), the Vidai, and beyond — the women of both families sing.

There are songs for when preparations begin, songs for the tilak, songs for when the [groom's party is welcomed (Parichhan)](/blogs/mithila-marriage-traditions/parichhan-maithil-wedding), songs for the wedding ceremony, songs for the Kohbar Ghar, songs for the Vidai, songs for [Dwiragaman](/blogs/mithila-marriage-traditions/dwiragaman-mithila-marriage). Each moment has its music.

The women who know these songs carry generations of tradition in their memory. When a grandmother sings a Vidai song, she is not just remembering words — she is transmitting something that has been transmitted to her by her own grandmother. And by singing it, she ensures it survives.

## What Are Sohar Songs?

**Sohar** is the most widely recognised genre of Maithili women's songs. Sohar songs are traditionally associated with two great occasions: the birth of a child and a wedding. Both are understood as moments of arrival — of new life, of family growth, of celebration.

At a Maithil wedding, sohar songs are sung at the festive gatherings of the pre-wedding period and the early celebrations — when preparations are underway, at the tilak ceremony, and at other occasions before the wedding day itself. They celebrate the joy of what is happening and invoke blessings for the couple.

Sohar songs are in Maithili — the language is an integral part of their identity. Even women who speak Hindi or other languages in daily life typically know and sing sohar in Maithili at family ceremonies. The songs are a living connection to the [Maithili language](/blogs/mithila-culture-heritage/maithili-language-identity) and the cultural world it carries.

## The Broader World of Wedding Geet

Beyond sohar, the term *geet* (song) covers a wide range of traditional compositions, each associated with a specific moment in the wedding:

**Byah ke geet (wedding day songs)** — songs sung during or alongside the main wedding ceremonies. They celebrate the union and invoke blessings from the divine.

**Kohar geet** — songs sung in connection with the Kohbar Ghar — the sacred room decorated with Madhubani paintings. As the couple comes to this room together, the gathered women sing outside the door, filling the moment with music.

**Vidai geet** — farewell songs, sung as the bride prepares to leave her natal home. These songs are among the most emotionally powerful in the tradition — they speak of love, of the weight of departure, of the new life ahead. A woman who grew up hearing them will rarely hear them at her own wedding without being deeply moved.

**Dwiragaman geet** — songs sung at the time of Dwiragaman, the bride's second departure from her natal home.

**Parichhan geet** — songs of welcome, sung as the groom's wedding party arrives and the Parichhan ceremony is performed.

Each of these song types has its particular emotional register — celebratory, prayerful, sorrowful, joyful. Together, they give the Maithil wedding its complete musical landscape.

## Vidyapati and the Maithili Poetic Tradition

Any discussion of Maithili music must acknowledge **Vidyapati** (c. 1352–1448) — the medieval poet-saint whose compositions in Maithili remain among the most cherished in the tradition. Vidyapati wrote devotional *padas* addressed to the divine — compositions that use the imagery of love and longing to explore the soul's relationship with god.

His influence on Maithili's musical and poetic identity is profound. The tradition of women's communal singing in Maithili — at weddings, at festivals, at family ceremonies — exists within the same cultural world that produced Vidyapati's work. Even wedding songs that are not directly from his pen carry something of his tradition's depth.

## How These Songs Are Passed Down

Maithili wedding songs are an oral tradition. They are learned by women from their mothers, aunts, grandmothers and female elders — by listening, by participating, by gradually absorbing a repertoire across many family occasions.

This means that the songs known within a particular family may differ from those known in another. Words, tunes and rhythms vary. Some songs are widely shared across the region; others are more specific to a particular village or family's tradition. This variation is not a flaw — it is a feature of a living tradition that adapts even as it endures.

Today, recordings and written collections exist, making it easier for younger generations who may not have as many elder women in their family to learn songs they might not otherwise encounter. Online platforms and community efforts have helped preserve and share this repertoire.

## Songs in Modern Maithil Weddings

In contemporary weddings — whether held in ancestral villages, city homes or hotel banquet halls — the tradition of women's singing survives in many families, though its form varies.

In some families, the full complement of songs is sung at every appropriate moment. In others, a smaller selection is sung at the key occasions. In some urban settings, professional singers or musicians perform Maithili songs during celebrations, filling the gap where the family's own singers might once have gathered.

What persists across all of these variations is the recognition that music belongs to a Maithil wedding. A wedding without Maithili songs feels, to many families, incomplete — not because of any formal requirement, but because the songs are part of what makes it specifically theirs.

## Frequently Asked Questions

**What are Sohar songs?**
Sohar are traditional songs in Maithili sung by women at births and weddings. At a Maithil wedding, they are sung at festive gatherings before and during the celebration, to mark the occasion with joy and blessings.

**When are Vidai songs sung?**
Vidai songs are sung as the bride prepares to leave her natal home after the wedding. They are among the most emotionally powerful songs in the tradition, expressing the family's love and the weight of the farewell.

**How are Maithili wedding songs learned?**
Primarily through an oral tradition — women learn by listening to and singing with older female relatives across many family occasions. Some recordings and written collections also exist.

**Is Vidyapati associated with Maithili wedding songs?**
Vidyapati is the medieval poet-saint whose Maithili compositions remain deeply influential. While not all wedding songs are from his work, his legacy shapes the broader tradition of Maithili devotional and celebratory song within which wedding music sits.

**What happens if a family does not know the traditional songs?**
Many families seek out recordings, community sources or professional singers to bring Maithili music into their wedding. The tradition is flexible enough to accommodate different levels of knowledge while still preserving its spirit.
$$,
  'Mithila Jodi Team',
  'Maithili Wedding Songs: Sohar, Geet and the Voice of a Mithila Wedding | Mithila Jodi',
  'Discover the role of Maithili wedding songs in a traditional Maithil wedding — sohar, Kohar geet, Vidai songs, Parichhan geet and more. Understand how these songs are passed down and why they matter.',
  ARRAY['maithili wedding songs', 'sohar song mithila', 'maithili wedding geet', 'mithila wedding music', 'sohar maithili', 'maithil vivah songs'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';


-- ── Article I: Parichhan ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Parichhan in a Maithil Wedding? The Formal Welcome of the Groom',
  'parichhan-maithil-wedding',
  'When the groom''s wedding party arrives, they are welcomed through Parichhan — a ritual of arati, songs and offerings unique to the Maithil wedding. Learn what happens, who performs it and what it means.',
  $$
## What Is Parichhan?

In a traditional Maithil wedding, the groom does not simply walk into the wedding venue. He is received.

When the groom's baraat (wedding party) arrives, the women of the bride's family come forward to welcome him with a formal ceremony called **Parichhan**. It is a ritual of honour — arati (lamp ritual), an auspicious mark, offerings and songs — performed specifically to receive the groom as the wedding day's central figure.

Parichhan is one of the distinctively warm and musical moments of a Maithil wedding. If you have attended one, you will likely remember it: the gathering of women with lamps and garlands, the sound of songs filling the air as the groom steps forward to be received.

## When Does Parichhan Take Place?

Parichhan takes place on the wedding day, when the groom's baraat arrives at the bride's home or the wedding venue. It happens before the main wedding ceremony begins — the Parichhan is, in a sense, the formal opening of the wedding day for the groom's arrival.

## What Happens During Parichhan?

### The Gathering of Women

As the baraat arrives, the women of the bride's household come forward together. Senior women — the bride's mother, aunts and other female relatives — lead the welcome, with younger women and relatives participating.

### Arati

The central element of Parichhan is the **arati** — the ritual of the lamp. A senior woman, typically the bride's mother, performs arati for the groom: a lit lamp or a thali (plate) bearing a flame is moved in a circular motion before the groom's face, accompanied by prayers or the simple recitation of auspicious words.

Arati is a profound gesture in Hindu tradition — it is offered to deities, to sacred images, and to honoured guests at significant moments. By performing arati for the groom, the bride's mother is offering him the highest form of welcome she can give. She is honouring him not merely as a guest, but as the person who will be her son-in-law.

### The Welcome Tika

As part of Parichhan, the bride's mother or another senior woman may apply an auspicious tika to the groom's forehead — a mark of welcome and blessing. This is distinct from the formal tilak applied at the [Tilak ceremony](/blogs/mithila-marriage-traditions/tilak-ceremony-maithil-marriage) earlier in the engagement process. The Parichhan tika is specifically a mark of welcome and joy on the wedding day.

### Offerings

The welcoming party presents offerings to the groom — flowers, betel leaves, rice grains, sweets, or other auspicious items. Each of these is a traditional expression of good wishes and hospitality, adapted across families to reflect their own customs.

### Songs

Parichhan is accompanied by [Maithili wedding songs](/blogs/mithila-marriage-traditions/maithili-wedding-songs-sohar-geet). The women sing *parichhan geet* — songs composed specifically for this moment of welcome. The groom's arrival is not a silent or muted event; it is celebrated with voice and song from the moment he is seen.

The singing continues as the arati is performed and the offerings are made. The music is not background — it is part of the ritual itself.

## The Significance of Parichhan

Parichhan carries a meaning that goes beyond ceremony.

When the bride's mother stands before the groom with a lamp and performs arati, she is making a statement of welcome that every family member witnessing it understands. She is saying: you are honoured here. You are received. Our daughter's husband is someone we welcome into our family.

In the formal relationships of a traditional Maithil wedding — where the two families have been through the careful processes of [Siddhant](/blogs/mithila-marriage-traditions/siddhant-ceremony-mithila-marriage), Tilak, and all that has followed — the Parichhan is the moment of warmth. The ritual formalisation is behind them; what stands in the Parichhan is the human gesture of welcome.

It is also a moment that belongs specifically to the women of the bride's family. In many other parts of the wedding, the purohit leads, and the families participate. In the Parichhan, the women lead, and their leadership is the defining character of the ceremony.

## Parichhan in the Wedding Sequence

In the full Maithil vivah sequence, Parichhan falls near the beginning of the wedding day:

Baraat arrives → **Parichhan** → Madhuparka → Kanyadan → Saat Phere → [Sindoor Daan](/blogs/mithila-marriage-traditions/sindoor-daan-maithil-marriage) → [Kohbar Ghar](/blogs/mithila-marriage-traditions/kohbar-kohbar-ghar-mithila-marriage) → Vidai

For the complete sequence of Maithil wedding ceremonies, see the [Complete Guide to Maithil Vivah](/blogs/mithila-marriage-traditions/complete-guide-maithil-vivah).

## Parichhan Today

In contemporary Maithil weddings, Parichhan is observed in various forms depending on the setting and family. In traditional village settings, it may involve an elaborate gathering of women with full ceremonial attention. In city weddings and hotel venues, the ceremony adapts to the space and context — but the central elements (arati, welcome mark, offerings, songs) are preserved.

Even in families where many other traditional elements have evolved or been simplified, the Parichhan tends to survive. It is a moment that families feel the meaning of instinctively — the mother welcoming the son-in-law with a lamp in her hands is an image that speaks across generations.

## Frequently Asked Questions

**What is Parichhan in a Maithil wedding?**
Parichhan is the formal welcome ceremony performed by the women of the bride's family when the groom's baraat arrives. It involves arati (lamp ritual), an auspicious welcome tika, offerings, and Maithili songs.

**Who performs Parichhan?**
The women of the bride's family lead the Parichhan, with the bride's mother typically performing the arati. Other senior female relatives and younger women participate and sing.

**When does Parichhan take place?**
When the groom's wedding party arrives at the venue, before the main wedding ceremony begins. It is one of the first formal rituals of the wedding day.

**Is the Parichhan tika the same as the Tilak engagement?**
No — these are separate ceremonies. The Tilak engagement (performed by the bride's family at the groom's home, weeks before the wedding) is the formal engagement ceremony. The tika at Parichhan is a welcome mark applied on the wedding day when the groom arrives.
$$,
  'Mithila Jodi Team',
  'What Is Parichhan in a Maithil Wedding? The Formal Welcome of the Groom | Mithila Jodi',
  'Learn about Parichhan — the Maithil wedding ceremony where the women of the bride''s family formally welcome the groom''s baraat with arati, songs and offerings on the wedding day.',
  ARRAY['parichhan maithil wedding', 'parichhan mithila wedding', 'groom welcome mithila wedding', 'baraat welcome mithila', 'maithil vivah parichhan'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';


-- ── Article J: Naina Jogin ──

INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name,
   seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Naina Jogin in Maithil Wedding Tradition: A Pre-Wedding Protective Ritual',
  'naina-jogin-maithil-wedding',
  'Naina Jogin is a pre-wedding protective tradition observed in many Maithil families — prayers and offerings seeking divine blessing and protection for the couple before the wedding. Learn what it involves and why it varies between families.',
  $$
## What Is Naina Jogin?

Among the many pre-wedding customs that prepare a Maithil household for the ceremonies ahead, **Naina Jogin** stands apart. It is a protective ritual — an act of seeking divine blessing and protection for the couple as they step toward one of life's most significant thresholds.

In many Maithil families, the days before a wedding include prayers and offerings to a *Jogin* — a divine protective figure in the folk religious tradition of Mithila. The term *Jogin* (feminine of Yogi) refers to a class of powerful divine beings associated with protection, transitions and the sacred. Marriage — understood as a threshold moment in which the ordinary order of the family changes and the couple enters something entirely new — is precisely the kind of event such protection is sought for.

Before anything else, an important note: Naina Jogin is not observed uniformly across all Mithila families or communities. Practices vary significantly between families, regions and sub-communities. This is a living folk tradition, not a standardised ceremony, and what one family observes may differ considerably from another's practice. Where this article describes specific elements, it describes what is broadly understood — not a universal rulebook.

## The Idea Behind the Ritual

Many traditional cultures recognise that transitions in life carry a particular kind of vulnerability. A birth, a death, an initiation, a marriage — these are threshold moments. The normal boundaries of everyday life are disturbed, and the people crossing those thresholds are understood to be temporarily in a state of heightened exposure.

The Naina Jogin tradition acknowledges this understanding. By performing prayers and offerings before the wedding, the family places the couple — and the entire household, in the midst of its own upheaval — under the care of a divine protective presence. The ritual asks: watch over them. Guard this beginning.

This is not about fear. It is about reverence — a recognition that what is happening is significant enough to deserve divine acknowledgment.

## What Happens in the Naina Jogin Ritual?

Because practices vary, the following describes elements that are broadly observed, not a single fixed sequence:

### Offerings at a Shrine

In many families, the Naina Jogin ritual involves a visit to a local shrine or sacred site associated with the Jogin or a related deity. The offerings brought may include flowers, fruits, coconut, sweets, cloth or oil lamps — whatever the family's tradition prescribes and the deity is understood to favour.

The visit may be made by the women of the household, by the family as a whole, or by the bride or groom specifically, depending on the family's practice.

### Prayers and Ritual Recitation

The family purohit may lead prayers appropriate to the occasion, or a senior woman of the household may lead the ritual recitation. In some families, specific mantras associated with the Jogin tradition are recited; in others, more general protective prayers are offered.

### Women's Songs

As with virtually every other ritual moment in a Maithil wedding, [Maithili songs](/blogs/mithila-marriage-traditions/maithili-wedding-songs-sohar-geet) accompany the Naina Jogin ritual. Women of the household gather and sing, marking the occasion with the community's voice.

### Timing

Naina Jogin is typically observed in the days before the main wedding ceremony — often the night before the wedding, or two to three days before. The timing is chosen in consultation with the family purohit, who determines the auspicious moment within the pre-wedding period.

## Naina Jogin Within the Broader Tradition

The Naina Jogin ritual belongs to a category of protective and preparatory practices that exist across many North Indian communities. Before important events — particularly weddings — families across many Hindu traditions observe some form of protective ritual: offerings to the kula devi (family deity), prayers for the household, the tying of protective threads (raksha) around the wrists of the couple.

The Naina Jogin tradition is the Mithila community's specific expression of this universal impulse. It reflects the community's own folk religious landscape — a world that includes both Sanskritic ritual (conducted by the purohit) and the older layer of local, folk-religious practice (the Jogin tradition, the local shrines, the women's ritual knowledge).

Both layers are real. Both are part of what a traditional Maithil wedding is.

## A Note on Variation

Because the Naina Jogin tradition is rooted in local and family-specific practice rather than pan-Hindu standardised ritual, it varies more than many other elements of the Maithil wedding. Some families place great importance on it and observe it with full ceremony. Others observe a simpler form. Others may observe a different protective ritual with a similar purpose. And some families, particularly in cities or those who have moved away from ancestral areas, may not observe it at all.

This variation is not a problem — it is a feature of a tradition that has always been shaped by local and family context. What matters is the spirit: the family's recognition that this is a sacred moment, and their desire to seek blessing and protection for the couple who are crossing this threshold.

If you are preparing for a Maithil wedding and wish to observe the Naina Jogin tradition in your family's form, the best guide is your own family's purohit and your senior family members. They will know the specific tradition that belongs to your family and your place.

## Naina Jogin in the Wedding Journey

In the sequence of a traditional Maithil vivah, Naina Jogin is one of the pre-wedding rituals that set the spiritual tone for the ceremonies ahead. After the [Siddhant](/blogs/mithila-marriage-traditions/siddhant-ceremony-mithila-marriage) and [Tilak](/blogs/mithila-marriage-traditions/tilak-ceremony-maithil-marriage) have established the human commitments on both sides, the pre-wedding rituals like Naina Jogin seek the divine attention that Mithila tradition considers equally essential.

For the full picture of the Maithil marriage journey, see the [Complete Guide to Maithil Vivah](/blogs/mithila-marriage-traditions/complete-guide-maithil-vivah).

## Frequently Asked Questions

**What is Naina Jogin in Mithila?**
Naina Jogin is a pre-wedding protective ritual observed in many Maithil families. It involves prayers and offerings to a Jogin (a divine protective figure in Mithila's folk religious tradition), seeking blessings and protection for the couple before the wedding.

**When is Naina Jogin performed?**
Typically in the days before the main wedding — often the night before or two to three days earlier, in consultation with the family purohit.

**Who leads the Naina Jogin ritual?**
In some families, the purohit leads; in others, a senior woman of the household takes this role. The specific leadership varies by family tradition.

**Do all Mithila families observe Naina Jogin?**
No — practices vary significantly between families, regions and communities within the broader Mithila tradition. Some observe it in full form; others in a simpler way; others do not observe it at all, or observe a different protective pre-wedding ritual. Your family purohit and elders are the best guide.

**Is Naina Jogin a Hindu ritual?**
It exists at the intersection of Sanskritic Hindu tradition and Mithila's local folk religious practice. It reflects the layered religious world of the Mithila community, which has always woven together both.
$$,
  'Mithila Jodi Team',
  'Naina Jogin in Maithil Wedding Tradition: A Pre-Wedding Protective Ritual | Mithila Jodi',
  'Learn about Naina Jogin — the pre-wedding protective ritual observed in many Maithil families, involving prayers and offerings to seek divine blessings for the couple before the wedding.',
  ARRAY['naina jogin mithila', 'naina jogin maithil wedding', 'mithila pre-wedding ritual', 'protective ritual mithila wedding', 'maithil vivah naina jogin'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';
