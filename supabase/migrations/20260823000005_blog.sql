-- ============================================================
-- Migration: 20260823000005_blog.sql
-- Blog tables, indexes, triggers, seed categories and articles
-- ============================================================

-- blog_categories
CREATE TABLE blog_categories (
  id              serial PRIMARY KEY,
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text,
  seo_title       text,
  seo_description text,
  cover_url       text,
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- blog_posts
CREATE TABLE blog_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     integer NOT NULL REFERENCES blog_categories(id) ON DELETE RESTRICT,
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  excerpt         text,
  content         text NOT NULL DEFAULT '',
  cover_url       text,
  author_name     text NOT NULL DEFAULT 'Mithila Jodi Team',
  seo_title       text,
  seo_description text,
  keywords        text[],
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured        boolean NOT NULL DEFAULT false,
  published_at    timestamptz,
  created_by      uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_category   ON blog_posts (category_id, status, published_at DESC);
CREATE INDEX idx_blog_posts_slug       ON blog_posts (slug);
CREATE INDEX idx_blog_posts_status     ON blog_posts (status, published_at DESC);
CREATE INDEX idx_blog_categories_slug  ON blog_categories (slug);
CREATE INDEX idx_blog_categories_active ON blog_categories (is_active, sort_order);

CREATE TRIGGER blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: Categories
-- ============================================================

INSERT INTO blog_categories (name, slug, description, seo_title, seo_description, sort_order) VALUES
(
  'Gotra & Family Lineage',
  'gotra-family-lineage',
  'Understand the importance of gotra, maternal gotra, mool and gram in Mithila marriage traditions.',
  'Gotra & Family Lineage in Mithila | Mithila Jodi',
  'Learn about gotra, maternal gotra, mool and gram — the pillars of Mithila family lineage and their role in Mithila matrimony.',
  1
),
(
  'Mithila Marriage & Traditions',
  'mithila-marriage-traditions',
  'Explore the rituals, customs and traditions of Mithila weddings and the role of family.',
  'Mithila Marriage Traditions & Wedding Customs | Mithila Jodi',
  'Explore the rituals, ceremonies and customs that define traditional Mithila weddings and the deep role of family in Mithila marriage.',
  2
),
(
  'Mithila Culture & Heritage',
  'mithila-culture-heritage',
  'Discover Mithila culture, the Maithili language, Madhubani art and the traditions of the community.',
  'Mithila Culture, Heritage & Traditions | Mithila Jodi',
  'Discover the rich culture and heritage of the Mithila region — its history, Maithili language, Madhubani art and community traditions.',
  3
),
(
  'Matrimonial & Marriage Guide',
  'matrimonial-marriage-guide',
  'Practical guidance on matrimonial profiles, biodatas and preparing for marriage.',
  'Matrimonial & Marriage Guide for Mithila Families | Mithila Jodi',
  'Practical matrimonial guides for Mithila families — how to create biodatas, what to include in profiles and how to prepare for marriage.',
  4
),
(
  'Horoscope & Marriage',
  'horoscope-marriage',
  'Learn about rashi, nakshatra, manglik and kundli matching in Hindu matrimony.',
  'Horoscope & Marriage Matching for Mithila | Mithila Jodi',
  'Learn about rashi, nakshatra, manglik dosha and kundli matching as used in Hindu and Mithila matrimonial traditions.',
  5
),
(
  'Family & Marriage',
  'family-marriage',
  'The role of family in marriage decisions, joint families and modern Mithila families.',
  'Family & Marriage in Mithila | Mithila Jodi',
  'Explore how family shapes marriage decisions in the Mithila community, from joint family dynamics to modern approaches.',
  6
),
(
  'Mithila Places & Family Roots',
  'mithila-places-family-roots',
  'Explore the villages, towns and native places of the Mithila region.',
  'Mithila Villages, Towns & Family Roots | Mithila Jodi',
  'Explore the villages, towns and ancestral native places of the Mithila region and how they shape family identity.',
  7
),
(
  'Biodata & Matrimonial Tips',
  'biodata-matrimonial-tips',
  'Tips for creating effective matrimonial biodatas and profiles.',
  'Biodata & Matrimonial Tips for Mithila | Mithila Jodi',
  'Expert tips for creating a strong matrimonial biodata and profile for the Mithila community — what to include and how to stand out.',
  8
);

-- ============================================================
-- SEED: Articles
-- ============================================================

-- -------------------------------------------------------
-- CATEGORY 1: Gotra & Family Lineage
-- -------------------------------------------------------

-- Article 1
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Gotra? Meaning, Importance and Role in Hindu Marriage',
  'what-is-gotra',
  'Gotra is a lineage system rooted in Vedic traditions. Understand its meaning, how it is determined, and why it matters in Hindu and Mithila marriages.',
  $art1$
## What Is Gotra?

Gotra is one of the most fundamental concepts in Hindu social identity. In the simplest terms, it refers to a lineage — a line of patrilineal descent traced back to a common ancestor, typically a revered Vedic rishi (sage). If you have ever filled out a matrimonial form or attended a Hindu religious ritual, you have almost certainly been asked your gotra.

The word itself comes from Sanskrit: *go* (cow) and *tra* (shelter or pen). Originally, the term referred to a cow-shed or the enclosure that housed a particular family's cattle — a shared resource among early Vedic communities. Over time, *gotra* evolved to mean the entire group of people who descend from a common ancestor, much like a clan or lineage.

## The Seven Original Gotras

According to ancient Vedic literature, all gotras trace back to one of the Saptarishis — the seven primordial sages. These are:

1. **Kashyapa**
2. **Bharadwaja**
3. **Vishvamitra**
4. **Gautama**
5. **Jamadagni**
6. **Vashishtha**
7. **Atri**

Over centuries, as these lineages branched and grew, new gotras emerged from disciples and later descendants. Today, there are hundreds of gotras across Hindu communities, many of them named after sages who were themselves descendants of the original seven. Different texts give slightly varying lists — some include Agastya as an eighth rishi — and the exact count of recognised gotras differs between communities and traditions.

## How Is Gotra Inherited?

Gotra is patrilineal: a child inherits the gotra of their father. This remains unchanged throughout a person's life for men. For women, the tradition varies somewhat — in many communities, a woman formally takes on her husband's gotra at the time of marriage, though her natal gotra may still be referenced for certain purposes. In Mithila practice, both a person's own (paternal) gotra and their [maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra) — the gotra inherited through the mother — are considered important identifiers.

## Gotra and Marriage: Why It Matters

The most visible role of gotra in daily life today is in matrimonial matching. In many Hindu communities, marriage within the same gotra (sagotra vivah) is traditionally avoided. The reasoning is that people of the same gotra are considered to share a common ancestor and are therefore kin — marriage within such a group is seen as analogous to marrying a close relative.

It is important to understand that this is a cultural and religious tradition, not a legal prohibition under Indian civil law. Different communities observe this tradition with different degrees of strictness. Some communities look at only the paternal gotra; others, including many Mithila families, check both paternal and maternal gotra before considering a match.

The [role of gotra in Mithila marriage](/blogs/gotra-family-lineage/why-gotra-matters-in-marriage) goes further than a simple same-gotra check. Families often discuss [mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila) (ancestral origin) and [gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila) (native village) alongside gotra to ensure the two families are not too closely related through any of several different lines.

## Gotra in Mithila Specifically

Within the Maithil Brahmin community and other Mithila communities, gotra is part of a broader family identity system. Alongside gotra, a family is identified by their mool and gram. These three elements together — gotra, mool, gram — form what is sometimes called the *parichay* (introduction) of a Mithila family. In traditional matrimonial discussions, these three details are among the first things exchanged between families.

## A Living Tradition

For many families today, gotra is a matter of cultural continuity and community identity as much as it is a practical criterion for marriage matching. Younger generations may engage with it differently than their parents or grandparents did, and views on how strictly gotra rules should be applied vary widely — even within the same community or city.

Whether you see it as a sacred lineage going back thousands of years, or simply as an important piece of your family's heritage, gotra remains a meaningful part of Hindu and Mithila identity.

---

Mithila Jodi profiles include gotra, mool and gram details to help families make informed introductions. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art1$,
  'Mithila Jodi Team',
  'What Is Gotra? Meaning, Importance and Role in Hindu Marriage | Mithila Jodi',
  'Learn what gotra means in Hinduism and why it matters in marriage. Understand patrilineal lineage, the seven rishis, and how gotra is used in Mithila matrimony.',
  ARRAY['gotra', 'gotra meaning', 'gotra in marriage', 'what is gotra', 'gotra hinduism', 'mithila gotra'],
  'published',
  true,
  now()
FROM blog_categories c WHERE c.slug = 'gotra-family-lineage';

-- Article 2
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Maternal Gotra in Mithila Tradition?',
  'what-is-maternal-gotra',
  'Maternal gotra tracks the lineage through the mother''s side. Learn why Mithila communities pay special attention to both paternal and maternal gotra in marriage matching.',
  $art2$
## Understanding Maternal Gotra

When a Mithila family asks for gotra details before a matrimonial meeting, they are typically asking for more than just one gotra. They want to know both the paternal gotra and the maternal gotra. For families not from this tradition, the concept of maternal gotra can be unfamiliar — so let us explain it clearly.

## What Is Maternal Gotra?

Maternal gotra — sometimes called *nanihal ka gotra* or simply *nanke gotra* in spoken usage — refers to the gotra of the mother's natal family. More precisely, it is the paternal gotra of the mother (i.e., the gotra of the maternal grandfather).

To illustrate:
- Your **paternal gotra** is inherited from your father, and traces your father's patrilineal lineage.
- Your **maternal gotra** is the gotra of your mother's father — the lineage into which your mother was born.

So if your father belongs to the Kashyapa gotra and your mother's father belongs to the Bharadwaja gotra, then your paternal gotra is Kashyapa and your maternal gotra is Bharadwaja.

## Why Does Mithila Check Both?

In many North Indian Hindu communities, matrimonial matching focuses primarily on the paternal gotra — if the bride and groom have different paternal gotras, that aspect is considered clear. The Mithila community (and particularly Maithil Brahmins) tends to go further, checking both paternal and maternal gotras of both the bride and the groom.

The reasoning is an extension of the same underlying principle that makes same-gotra marriage traditionally inadvisable: the goal is to ensure the two families are not too closely related through any line of descent. Checking the maternal gotra adds a second layer of verification.

This means that in strict Mithila tradition, ideally the paternal gotra of the groom should differ from both the paternal gotra and the maternal gotra of the bride — and vice versa. In practice, how strictly this is applied varies between families. Some families observe this carefully; others focus primarily on the paternal gotra with the maternal gotra as a secondary check.

## Practical Implications for Marriage Matching

When you are putting together a matrimonial profile or preparing for a family meeting, it is worth knowing both your own paternal gotra and your maternal gotra. In Mithila matrimonial discussions:

- The **paternal gotra** is always required.
- The **maternal gotra** is typically asked as well, particularly by families who observe stricter matching criteria.
- In some families, additional gotras (such as the paternal grandmother's natal gotra) may also be mentioned, though this is less common.

If you are unsure of your maternal gotra, ask your mother or a senior family member — it is simply your maternal grandfather's gotra.

## Does the Rule Always Apply the Same Way?

No. Requirements vary between families, regions and sub-communities within Mithila. What one family considers essential, another may not prioritise in the same way. This is worth keeping in mind during any matrimonial discussions — an open conversation about what each family expects is always the best approach.

For a side-by-side comparison of paternal and maternal gotra, see [Gotra vs Maternal Gotra: What Is the Difference?](/blogs/gotra-family-lineage/gotra-vs-maternal-gotra).

---

Mithila Jodi profiles include both gotra and maternal gotra details so families can quickly check compatibility. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art2$,
  'Mithila Jodi Team',
  'What Is Maternal Gotra in Mithila? | Mithila Jodi',
  'Understand maternal gotra and why Mithila families check both paternal and maternal gotra before marriage. A practical guide for the Mithila community.',
  ARRAY['maternal gotra', 'nanihal gotra', 'mithila maternal gotra', 'gotra marriage mithila'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'gotra-family-lineage';

-- Article 3
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Gotra vs Maternal Gotra: What Is the Difference?',
  'gotra-vs-maternal-gotra',
  'Many people confuse gotra and maternal gotra. This article clearly explains the difference and why both matter in Mithila marriage traditions.',
  $art3$
## Gotra vs Maternal Gotra

The terms *gotra* and *maternal gotra* both refer to lineage, but they trace different lines of family descent. Understanding the distinction is especially useful when preparing a matrimonial profile or discussing a potential match in the Mithila tradition.

## The Core Difference

| | **Gotra (Paternal)** | **Maternal Gotra** |
|---|---|---|
| **Also called** | Pitripalika gotra, swayam ka gotra | Nanihal ka gotra, nanke gotra |
| **Traced through** | Father's patrilineal line | Mother's father's patrilineal line |
| **Inherited from** | Father (same as his gotra) | Mother (her natal/paternal gotra) |
| **Stays with you?** | Yes, for life | Yes, it is fixed at birth |
| **Used in marriage matching?** | Always | Typically in Mithila; varies elsewhere |

## An Example

Suppose Rahul's father belongs to the **Vashishtha gotra**, and Rahul's mother was born into a family with the **Gautama gotra**:

- Rahul's **paternal gotra** = Vashishtha
- Rahul's **maternal gotra** = Gautama

Now suppose Priya's father belongs to the **Bharadwaja gotra**, and her mother's family has the **Vashishtha gotra**:

- Priya's **paternal gotra** = Bharadwaja
- Priya's **maternal gotra** = Vashishtha

In strict Mithila tradition, a family checking this match would note that Rahul's paternal gotra (Vashishtha) is the same as Priya's maternal gotra (Vashishtha). Depending on how strictly the family observes this, it may be flagged for discussion.

## Why Mithila Checks Both

As explained in [What Is Maternal Gotra?](/blogs/gotra-family-lineage/what-is-maternal-gotra), the Mithila community — particularly Maithil Brahmins — tends to check both gotras because the underlying goal is to ensure the two families are not closely related through any line of recent descent. Same-gotra marriages are traditionally avoided as the individuals involved are considered to share ancestry.

By checking both paternal and maternal gotras, families can better ensure that the two lines of descent have been distinct for several generations.

## Important Nuance

The degree to which this matching is applied varies widely between families, communities, and regions. Some families are very strict about both gotras; others focus primarily on the paternal gotra and treat the maternal gotra as a secondary consideration. Some families in more urban or mixed settings may not check the maternal gotra at all.

There is no single universal rule here. The best approach when meeting a potential match's family is to be open about your own gotra details and to ask clearly what the family considers important.

For a deeper explanation of [why gotra matters in Mithila marriage](/blogs/gotra-family-lineage/why-gotra-matters-in-marriage), see our dedicated article.

---

Mithila Jodi profiles include both paternal gotra and maternal gotra, making it straightforward for families to check compatibility. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art3$,
  'Mithila Jodi Team',
  'Gotra vs Maternal Gotra: Difference Explained | Mithila Jodi',
  'Understand the difference between paternal gotra and maternal gotra and why both are checked in Mithila matrimonial matching.',
  ARRAY['gotra vs maternal gotra', 'difference between gotra and maternal gotra', 'mithila gotra matching'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'gotra-family-lineage';

-- Article 4
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Why Is Gotra Important in Mithila Marriage?',
  'why-gotra-matters-in-marriage',
  'Gotra plays a central role in marriage compatibility in Mithila. Understand the cultural, social and historical reasons why gotra is checked before a marriage is arranged.',
  $art4$
## Why Gotra Matters in Mithila Marriage

For anyone new to Mithila matrimonial traditions, the first question families ask — often before names, education or occupation — may be about gotra. This can seem puzzling to those unfamiliar with the tradition. This article explains the reasons behind it.

## The Historical Rationale: Kinship and Genetic Distance

The most widely cited reason for checking gotra in marriage is the avoidance of close-kin marriage. People who share a gotra are considered to descend from the same rishi ancestor and are therefore regarded as being in a kinship relationship — even if the shared ancestor lived many generations ago.

Across many cultures and societies, norms around avoiding marriage between close relatives developed organically. The gotra system served as one such mechanism, providing a practical way to identify people who are likely to share ancestry — particularly in communities where inter-village marriages were common and family records were maintained only in memory or oral tradition.

## The Social Function

Beyond genetics, gotra also serves as a social identifier. In the Mithila community — where matchmaking has historically involved families from different villages meeting for the first time — having a shared system of lineage identifiers allowed families to quickly establish how two families were (or were not) related.

Alongside [mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila) (ancestral origin) and [gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila) (native village), gotra formed part of what might be called a family's social coordinates within the Mithila community. Two families might share a gotra but have different mool or gram, providing further differentiation.

## How Gotra Is Used in Mithila Matchmaking

In practice, gotra checking in Mithila typically involves:

1. **Paternal gotra** of the bride and groom — these should differ.
2. **[Maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra)** of the bride and groom — in stricter practice, these should also not match the other party's paternal gotra.
3. Discussion of mool and gram to further establish that the families are not too closely connected.

This is part of a broader conversation that families have — it sits alongside discussions about family background, occupation, temperament, and sometimes [kundli matching](/blogs/horoscope-marriage/kundli-matching-explained).

## Gotra Is One Criterion Among Several

It would be a mistake to present gotra as the only or even the most important consideration in a Mithila matrimonial match. It is a necessary early check — particularly for families who observe it strictly — but it functions as a filter, not the entire decision. Families also consider personality, values, family background, education, and many other factors.

## Modern Perspectives

Younger generations within Mithila communities often engage with the gotra tradition in varying ways. Some follow it carefully as a meaningful cultural practice. Others treat it as one piece of information among many. A smaller number may not prioritise it at all, particularly in inter-caste or inter-regional marriages.

What has remained consistent is that gotra is part of the Mithila family's sense of identity — and for many families, knowing and sharing your gotra is simply part of who you are.

---

Mithila Jodi profiles include gotra, mool and gram details to help families make informed introductions. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art4$,
  'Mithila Jodi Team',
  'Why Is Gotra Important in Mithila Marriage? | Mithila Jodi',
  'Understand the cultural, social and historical reasons why gotra is checked in Mithila matrimonial matching and how it is used in practice.',
  ARRAY['gotra in marriage', 'why gotra matters', 'mithila gotra marriage', 'gotra importance'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'gotra-family-lineage';

-- Article 5
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Can People With the Same Gotra Marry in Mithila?',
  'same-gotra-marriage',
  'Same-gotra marriage is traditionally avoided in many Hindu communities. Understand how this applies in Mithila, what the traditions say, and where practices vary.',
  $art5$
## Same-Gotra Marriage: What the Tradition Says

One of the most commonly asked questions about gotra is whether two people with the same gotra can marry. The short answer is: in traditional Mithila (and many other North Indian Hindu) practice, same-gotra marriage is generally avoided. But the complete picture is more nuanced than a simple yes or no.

## The Traditional Position

In Brahmanical and many other Hindu traditions, people who share the same paternal gotra are considered to belong to the same clan — descendants of the same ancient rishi ancestor. Because of this shared ancestry, they are regarded as being in a sibling-like kinship relationship (*bhai-behen ka rishta*), even if they have never met and their common ancestor lived thousands of years ago. Marriage between such individuals is traditionally considered inappropriate for the same reason that marriage between close kin is considered inappropriate.

This tradition is observed in many communities across North India, including among Maithil Brahmins and several other Mithila communities.

## What Mithila Practice Typically Involves

In Mithila matrimonial matching, the same-gotra check usually extends beyond just the paternal gotra:

- The **paternal gotra** of bride and groom should differ.
- In stricter practice, the paternal gotra of one party should not match the [maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra) of the other party.

This dual-gotra check reflects the community's broader approach of ensuring that the two families are not closely related through any line of known descent.

## Important Clarifications

**This is a cultural and religious tradition, not a legal prohibition.** Indian civil law does not prohibit same-gotra marriage. The Hindu Marriage Act, 1955, prohibits marriage between certain degrees of sapinda relationship — it does not mention gotra as a legal criterion. The practice of avoiding same-gotra marriage is upheld by tradition and community expectation, not by law.

**Practices vary significantly.** Some families observe this tradition very strictly. Others are more flexible, particularly if the families can demonstrate that the shared gotra name does not reflect a close common ancestor in recent generations (since many gotras have branched widely and may share a name without implying close kinship). In some communities and urban settings, the gotra check is much less strictly observed.

**Sub-community variation matters.** Practices differ between Maithil Brahmins, Kayasthas, and other communities within the Mithila region. Do not assume that what one community practises applies uniformly to all.

## A Note on Respectful Dialogue

If a match is identified where the gotras raise a question, the appropriate response is an open, respectful conversation between families — not an automatic rejection. Some families will not proceed; others will discuss the specific circumstances and seek guidance from a learned elder or family priest. Both responses are valid within the diversity of how this tradition is lived today.

---

Mithila Jodi profiles include gotra details so families can make informed decisions. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art5$,
  'Mithila Jodi Team',
  'Same Gotra Marriage in Mithila: What the Tradition Says | Mithila Jodi',
  'Learn whether same-gotra marriage is allowed in Mithila tradition, what the practice involves, and how it varies between communities and families.',
  ARRAY['same gotra marriage', 'sagotra marriage', 'same gotra marriage mithila', 'gotra marriage rules'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'gotra-family-lineage';

-- Article 6
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Mool in Mithila? Understanding Native Origins',
  'what-is-mool-in-mithila',
  'Mool refers to the ancestral origin or native place of a family in Mithila tradition. Learn what mool means and why it is asked in matrimonial matching.',
  $art6$
## What Is Mool?

If you have ever attended a Mithila family gathering or filled out a traditional matrimonial form, you may have encountered the term *mool*. Alongside [gotra](/blogs/gotra-family-lineage/what-is-gotra) and [gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila), mool is one of the three primary identifiers of a Mithila family's lineage and origin.

## The Meaning of Mool

The word *mool* comes from Sanskrit and means root or origin. In the Mithila context, mool refers to the ancestral place of origin of a family — the ancient settlement or territory from which the family traces its roots, distinct from where they may currently live.

Mool is not necessarily a specific village (that is gram). It tends to refer to a broader region or ancestral designation that situates the family within the traditional geography of Mithila. Some families describe their mool as a particular town, area or historical settlement; in some cases mool functions as a sub-regional identifier within the larger Mithila community.

## Mool vs Current Residence

It is common for Mithila families to have moved — sometimes generations ago — to cities like Patna, Delhi, Kolkata, Dhanbad or Mumbai. A family's current address tells you where they live now. Their mool tells you where their roots are.

This distinction matters in matrimonial contexts because two families living in the same city may still have very different ancestral origins within Mithila. Knowing the mool helps situate a family in the broader community network.

## How Mool Is Used in Matrimonial Matching

In Mithila matrimonial discussions, mool is typically shared alongside gotra and gram as part of the family's *parichay* (introduction). It helps families who may not know each other establish:

- Whether their ancestral roots overlap in ways that might indicate close kinship
- Whether the families come from the same broader community within Mithila
- A sense of shared regional identity and background

Together, [gotra, mool and gram form the core of Mithila family lineage identity](/blogs/gotra-family-lineage/mithila-family-lineage), and understanding all three gives the fullest picture of a family's heritage.

## Passing Mool Down Through Generations

Like gotra, mool is typically passed down through the paternal line. Children inherit the mool of their father, and it remains part of their identity regardless of where they are born or raised.

If you are unsure of your family's mool, ask a senior family member — grandparents are often the best source of this kind of information, as it is part of the oral heritage families carry with them.

---

Mithila Jodi profiles include mool details to help families understand each other's roots. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art6$,
  'Mithila Jodi Team',
  'What Is Mool in Mithila? Ancestral Origins Explained | Mithila Jodi',
  'Learn what mool means in Mithila tradition — the ancestral origin identifier used alongside gotra and gram in matrimonial matching.',
  ARRAY['mool mithila', 'what is mool', 'mool in mithila marriage', 'mithila family origin'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'gotra-family-lineage';

-- Article 7
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Gram or Native Village in Mithila? Family Roots Explained',
  'what-is-gram-in-mithila',
  'Gram refers to the ancestral village of a Mithila family. Discover why native village identity plays a significant role in Mithila community and matrimony.',
  $art7$
## What Is Gram?

In Mithila tradition, family identity is rooted in three interconnected concepts: [gotra](/blogs/gotra-family-lineage/what-is-gotra), [mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila) and gram. Of these, gram is perhaps the most concrete — it refers to the ancestral village or native place of a family.

## Gram as Ancestral Village

The word *gram* simply means village in Sanskrit and Hindi. In the Mithila matrimonial and social context, gram refers to the ancestral native village — the village from which the family hails, regardless of where they may now live.

This is an important distinction. A family may have lived in Patna, Delhi or Kolkata for two or three generations. Their current postal address is an urban flat or residential colony. But their *gram* remains the village in the Mithila belt where their ancestors lived — whether in Darbhanga, Madhubani, Sitamarhi, Saharsa or any of the dozens of towns and villages spread across the Mithila region.

## Why Gram Matters

Gram serves several purposes in Mithila social life:

**Community identification.** In a community spread across cities and countries, gram provides a way for people to locate themselves within the broader Mithila network. Two strangers at a gathering who discover they share a gram — or neighbouring grams — often feel an immediate connection.

**Matrimonial context.** In matrimonial discussions, gram is mentioned alongside gotra and mool. It helps families establish whether they may already know each other (through the same ancestral village network) and whether there are any closer connections to be aware of.

**Cultural and emotional identity.** For many families that have urbanised, the ancestral gram retains a deep emotional significance. The ancestral home — even if no longer maintained — is part of family identity. Festivals, ceremonies and the bodies of elders may still travel back to the gram.

## Gram and Village Networks in Mithila

Mithila has a well-developed tradition of village-based community networks. Villages are sometimes grouped in clusters (*para*) and historically formed the basis of local social governance and community events. These networks often shaped matrimonial alliances — families from the same village or neighbouring villages might develop ongoing relationships across generations.

At the same time, there was traditionally a preference for seeking matches from a certain distance — not too close (to avoid close-kin marriage) and not too far (to maintain community and cultural continuity). This interplay between gram and matrimonial geography is a fascinating aspect of Mithila social organisation.

## Knowing Your Gram Today

If you are putting together a matrimonial profile and are unsure of your ancestral gram, it is worth asking your parents or grandparents. The information is typically well-known within families, even if it is not commonly discussed in everyday urban life. It is part of the rich heritage that the Mithila community carries forward.

For a broader understanding of how gotra, mool and gram work together, see [Understanding Mithila Family Lineage](/blogs/gotra-family-lineage/mithila-family-lineage).

---

Mithila Jodi profiles include gram (native village) information to help families connect through their shared roots. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art7$,
  'Mithila Jodi Team',
  'What Is Gram or Native Village in Mithila? | Mithila Jodi',
  'Learn what gram means in Mithila tradition — the ancestral native village that forms part of a family''s identity in matrimonial and community contexts.',
  ARRAY['gram mithila', 'native village mithila', 'ancestral village mithila', 'gram in mithila marriage'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'gotra-family-lineage';

-- Article 8
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Understanding Mithila Family Lineage: Gotra, Mool and Gram',
  'mithila-family-lineage',
  'Mithila families identify themselves through a combination of gotra, mool and gram. This guide explains all three and how they work together in the Mithila matrimonial context.',
  $art8$
## The Three Pillars of Mithila Family Identity

If you want to understand how Mithila families introduce themselves in a matrimonial context, three terms are essential: **gotra**, **mool** and **gram**. Together, these three identifiers form the *parichay* — the lineage introduction — that has been central to Mithila community life for centuries.

## Gotra: The Rishi Lineage

[Gotra](/blogs/gotra-family-lineage/what-is-gotra) is the patrilineal lineage tracing back to a Vedic rishi ancestor. It is the most widely known of the three identifiers and the one most people encounter in matrimonial forms and ritual contexts across Hindu communities.

In Mithila, the gotra check typically involves both the paternal gotra (inherited from the father) and the [maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra) (the gotra of the mother's natal family). This dual check distinguishes Mithila practice from some other communities that focus only on the paternal gotra.

## Mool: The Ancestral Origin

[Mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila) translates as root or origin. In the Mithila context, it refers to the ancestral place of origin of the family — a broader designation of where the family's roots lie within the Mithila region.

Mool provides a layer of geographical identity beyond gotra. Two families might share the same gotra but have entirely different mool origins within Mithila, further confirming that they are not closely related.

## Gram: The Native Village

[Gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila) is the ancestral native village — the specific village from which the family descends. Many Mithila families now live in cities far from their ancestral village, but the gram remains part of their identity.

Gram is the most specific of the three identifiers, grounding the family in a particular place within the Mithila landscape. In matrimonial discussions, it can help families discover whether they share connections through the same ancestral village network.

## How the Three Work Together

The three identifiers complement each other and together provide a reasonably complete picture of a family's lineage:

| Identifier | What It Tells You |
|---|---|
| Gotra | Rishi ancestor lineage — who you descend from spiritually and genealogically |
| Mool | Ancestral regional origin — the broader area the family traces its roots to |
| Gram | Ancestral village — the specific place of origin |

In a traditional Mithila matrimonial meeting, a family might introduce themselves as: *"Hamar gotra Kashyapa hai, mool Darbhanga, gram Rajnagar."* This shorthand introduction immediately gives the other family enough information to understand the lineage background and begin assessing compatibility.

## Why All Three Still Matter Today

Even as Mithila families have spread across India and beyond, these identifiers have retained their role. They connect people to their roots, help establish community networks, and serve as a practical check in matrimonial matching. For families doing serious matrimonial research, having all three available for both the bride and groom provides the fullest picture.

If you are preparing a matrimonial profile and are uncertain about any of these, speaking with elder family members is the best starting point. This knowledge is part of your family's living heritage.

---

Mithila Jodi profiles include gotra, mool and gram for every profile, making it easy for families to complete this part of their research. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art8$,
  'Mithila Jodi Team',
  'Gotra, Mool and Gram: Understanding Mithila Family Lineage | Mithila Jodi',
  'A complete guide to gotra, mool and gram — the three pillars of Mithila family lineage identity and how they are used in matrimonial matching.',
  ARRAY['mithila family lineage', 'gotra mool gram', 'mithila lineage', 'mithila matrimonial matching'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'gotra-family-lineage';

-- Article 9
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Gotra and Marriage Compatibility in Mithila: A Practical Guide',
  'gotra-marriage-compatibility',
  'How are gotra and family lineage used to assess marriage compatibility in Mithila? This practical guide explains what families look for and how the process works.',
  $art9$
## Gotra and Marriage Compatibility: How It Works in Practice

For families navigating the Mithila matrimonial process for the first time — or for the younger generation helping their parents — the gotra compatibility check can seem mysterious. This guide explains what families typically do, step by step.

## Step 1: Gather Your Own Lineage Information

Before you can assess compatibility, you need to know your own details. For a Mithila matrimonial match, this means:

- Your **paternal gotra** (your gotra, inherited from your father)
- Your **[maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra)** (the gotra of your mother's natal family — your maternal grandfather's gotra)
- Your **[mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila)** (ancestral origin)
- Your **[gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila)** (ancestral native village)

If you are unsure about any of these, ask your parents or grandparents. This information is usually well-known within families.

## Step 2: Compare Gotras with the Potential Match

When a potential match is identified, the first practical check is gotra:

1. **Paternal gotra comparison:** The paternal gotra of the groom should differ from the paternal gotra of the bride. This is the most fundamental check.

2. **Cross-gotra check:** In stricter Mithila tradition, the paternal gotra of the groom should also differ from the maternal gotra of the bride, and vice versa. This ensures no close lineage connection through either the father's or mother's side.

If any of these match, many families will typically seek another match. How strictly this is applied, however, varies between families — it is worth having a clear conversation about expectations rather than assuming a shared understanding.

## Step 3: Consider Mool and Gram

Beyond gotra, the mool and gram details are compared to assess whether the families might already be connected through a shared ancestral region or village network. Two families with the same gram may have strong community connections — which can be a positive sign of shared roots, but also means the families should be confident they are not closely related.

## Step 4: Other Compatibility Factors

Gotra matching is typically just the first filter. Alongside it, families usually consider:

- **[Kundli matching](/blogs/horoscope-marriage/kundli-matching-explained)** — comparing birth charts, particularly rashi and nakshatra
- **Family background and values** — education, profession, family reputation
- **Personal compatibility** — temperament, life goals, expectations

Gotra clears the lineage check. The remaining factors determine whether the match is genuinely suitable.

## What If There Is a Gotra Match?

If the gotra check raises a concern, the appropriate response is a calm, respectful conversation between families. Some families will decide not to proceed; others will consult a learned elder or family priest and discuss the specific circumstances. There is no universally mandated action — the tradition provides guidance, and families exercise their own judgment.

## The Bigger Picture

Gotra compatibility is a meaningful part of the Mithila matrimonial process, but it is one element in a larger picture. Families that approach this process with openness, good communication and respect for both tradition and individual circumstances tend to make the best decisions.

---

Mithila Jodi profiles include gotra, mool and gram for every profile. [Explore Profiles](/explore) or [Create Your Profile](/register) and begin your search with the important details already in place.
$art9$,
  'Mithila Jodi Team',
  'Gotra and Marriage Compatibility in Mithila: A Practical Guide | Mithila Jodi',
  'A practical step-by-step guide to how gotra, mool and gram are used to assess marriage compatibility in Mithila matrimonial matching.',
  ARRAY['gotra marriage compatibility', 'mithila marriage matching', 'gotra compatibility', 'mithila matrimonial'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'gotra-family-lineage';

-- -------------------------------------------------------
-- CATEGORY 2: Mithila Marriage & Traditions
-- -------------------------------------------------------

-- Article 10
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Traditional Mithila Wedding Rituals Explained',
  'mithila-wedding-rituals',
  'Mithila weddings are rich with unique customs rooted in ancient tradition. Explore the key rituals of a traditional Mithila marriage ceremony.',
  $art10$
## The Richness of a Mithila Wedding

A Mithila wedding is not just a ceremony — it is an extended celebration of family, community, art and tradition that can unfold over several days. While specific rituals vary between families, sub-communities and regions within the Mithila belt, certain elements are widely shared and give Mithila weddings their distinctive character.

It is important to note upfront: customs differ between Maithil Brahmin families, Kayastha families, and other communities within the broader Mithila region. The account below draws on widely observed traditions but should not be taken as a universal description.

## Before the Wedding: Tilak and Engagement

The formal beginning of a Mithila wedding process is often marked by the **tilak ceremony** (also called tilakhar or sagai in some families). Representatives of the bride's family visit the groom's home to formally acknowledge the match and offer gifts. This is the moment that publicly seals the agreement between the two families.

Before this, families will have exchanged [gotra, mool and gram details](/blogs/gotra-family-lineage/mithila-family-lineage) and, in many cases, compared horoscopes. The tilak marks the transition from matching to commitment.

## Fixing the Date: Muhurta Selection

The wedding date is selected by a learned family priest based on astrological considerations — the alignment of the [rashi (moon sign)](/blogs/horoscope-marriage/what-is-rashi) and [nakshatra (birth star)](/blogs/horoscope-marriage/what-is-nakshatra) of the bride and groom, the Hindu calendar (panchang), and auspicious time windows (muhurta). The selected date and time are shared with both families and form the fixed point around which all preparations are organised.

## The Madhubani Art Tradition

One of the most visually distinctive aspects of Mithila weddings is the use of **Madhubani painting** (also called Mithila art). Traditionally, the walls of the wedding space — particularly the kohbar ghar (the room prepared for the couple) — are painted with intricate Madhubani designs by women of the family. These paintings are rich with symbolism: lotus flowers, fish, birds, sun and moon motifs all carry specific meanings related to fertility, prosperity and the union of the couple.

In contemporary weddings, this tradition takes many forms — from traditional wall paintings to printed fabric, invitation card designs and decorative artwork.

## The Vivah Ceremony

The core wedding ceremony typically includes:

- **Madhuparka** — the formal welcome of the groom by the bride's father with honey, curd and other auspicious substances, a deeply ancient Vedic ritual
- **Kanyadan** — the gifting of the bride by her parents to the groom, considered one of the most sacred acts a parent can perform
- **Saat Phere** — the seven rounds taken by the bride and groom around the sacred fire, each round accompanied by specific vows and prayers
- **Sindoor dan** — the groom applying sindoor (vermilion) to the bride's parting, the most visible symbol of marriage in North Indian Hindu tradition

Mithila weddings often include distinctive songs — **sohar** (birth and wedding songs) sung by women — and the recitation of specific Maithili language rituals and prayers.

## The Kohbar Ghar

The kohbar ghar — the room decorated with Madhubani art where the newly married couple spends their first night — is a distinctive feature of traditional Mithila weddings. The preparation of this room by women of the bride's family, and the songs and rituals associated with it, form a significant part of the ceremony.

## Post-Wedding Rituals

After the main ceremony, several rituals mark the bride's transition to her new home. The **bidai** (farewell of the bride from her natal home) is a deeply emotional moment. Arrival at the groom's home is accompanied by welcoming rituals, and the new bride is formally introduced to her in-laws and their household.

## A Living Tradition

Mithila weddings today range from intimate gatherings following centuries-old customs in ancestral villages to large celebrations in hotel banquet halls. What unites them is the underlying warmth, the centrality of family participation, and the threads of Mithila culture — Maithili language, Madhubani art, specific songs and prayers — that run through them even as other details change.

---

Explore [Mithila Jodi profiles](/explore) to find compatible matches from within the Mithila community.
$art10$,
  'Mithila Jodi Team',
  'Traditional Mithila Wedding Rituals Explained | Mithila Jodi',
  'Explore the key rituals and customs of a traditional Mithila wedding, from the tilak ceremony to saat phere and the distinctive Madhubani art tradition.',
  ARRAY['mithila wedding', 'mithila wedding rituals', 'mithila marriage customs', 'maithil brahmin wedding'],
  'published',
  true,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';

-- Article 11
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'The Role of Family in a Mithila Marriage',
  'role-of-family-mithila-marriage',
  'In Mithila tradition, marriage is not just between two individuals — it is between two families. Understand how families participate in the Mithila matrimonial process.',
  $art11$
## Marriage as a Family Affair

In the Mithila community — as in many traditional Hindu communities across India — marriage is understood as a union between two families, not merely between two individuals. This perspective shapes every aspect of the matrimonial process, from the initial search to the wedding day and beyond.

This is not to say that the preferences and compatibility of the bride and groom do not matter. They matter enormously. But the process of finding a match, evaluating compatibility, and formalising the union involves the extended family at every step.

## The Initial Search

In a traditional Mithila context, the search for a suitable match typically begins with the family — particularly the parents and close elders. The family's social network is the primary source of leads: relatives, family friends, community members and the local priest often play a role in identifying potential matches.

In parallel, families may circulate a [matrimonial biodata](/blogs/matrimonial-marriage-guide/how-to-create-matrimonial-biodata) — a document summarising the profile of the son or daughter. This biodata is shared with trusted contacts and, increasingly, on matrimonial platforms.

## Evaluating the Match

When a potential match is identified, the family does its due diligence. This involves:

- **Lineage verification:** Exchanging [gotra, mool and gram](/blogs/gotra-family-lineage/mithila-family-lineage) details to confirm there are no close-kin connections.
- **Background assessment:** Understanding the other family's reputation, values, occupation and general standing within the community.
- **Horoscope comparison:** Many families consult a priest or astrologer to compare the birth charts of the bride and groom.
- **Family meeting:** Before any formal decision is made, the two families typically meet — often in the bride's home — to get to know each other.

## The Role of Elders

Senior family members — grandparents, uncles, aunts — carry significant weight in matrimonial discussions in many Mithila families. Their experience, their community connections and their knowledge of family histories make them valuable voices in the process. A match that has the blessing of the elders on both sides tends to proceed more smoothly.

## Balancing Tradition and Individual Choice

Across the Mithila community today, there is significant variation in how much weight family opinion carries versus the preferences of the individual. In some families, the parents' decision is essentially final; in others, the son or daughter's consent and enthusiasm is the central criterion, with the family playing a supporting role.

Many families navigate a middle path: the parents identify suitable candidates, but the son or daughter has the opportunity to meet and decide. The family's role is to create good options, not to override the individual's fundamental choice.

## After the Wedding

The family's involvement does not end at the wedding ceremony. In joint family arrangements — still common in parts of Mithila — the new couple lives with the groom's family, and the relationships between families continue to be maintained. Festivals, family ceremonies, and community events provide ongoing occasions for the two families to interact.

Even in nuclear family arrangements, the bonds formed at a Mithila wedding tend to create lasting connections between the two families. In the Mithila understanding of marriage, the relationship between families is as much a part of what is created as the relationship between the couple.

---

Mithila Jodi makes it easy for families to search and connect. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art11$,
  'Mithila Jodi Team',
  'The Role of Family in a Mithila Marriage | Mithila Jodi',
  'Understand how family shapes every stage of the Mithila matrimonial process, from the initial search to the wedding and beyond.',
  ARRAY['mithila marriage family', 'family role mithila marriage', 'mithila matrimonial process', 'arranged marriage mithila'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';

-- Article 12
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Important Customs in a Mithila Marriage',
  'mithila-marriage-customs',
  'From the first meeting to the wedding day, Mithila marriages follow meaningful customs. Explore the most important practices that define a Mithila wedding.',
  $art12$
## The Customs That Shape a Mithila Marriage

A Mithila marriage is accompanied by a rich web of customs — some centuries old, some evolved with the times. These customs serve practical, spiritual and social purposes, and together they give the Mithila matrimonial process its distinctive character. While specific practices vary between families, sub-communities and regions, the following are among the most widely observed.

## The Matching Process: More Than a Checklist

Before any formal meeting takes place, families typically exchange important background information. [Gotra, mool and gram](/blogs/gotra-family-lineage/mithila-family-lineage) are shared to confirm there are no close lineage connections. Horoscopes may be exchanged for [kundli comparison](/blogs/horoscope-marriage/kundli-matching-explained). This preliminary exchange is both a practical screening and a sign of mutual seriousness.

## Pehli Mulaqat: The First Meeting

The first face-to-face meeting between families is an important occasion. Typically, the groom's family visits the bride's home (though this varies). Both families come prepared to learn about each other — family background, profession, values and way of life are all discussed, often over a shared meal. In traditional settings, the prospective bride and groom may have a brief opportunity to meet privately or in a small group setting.

## Tilak: The Formal Acceptance

Once both families have agreed to the match, the tilak ceremony formalises the commitment. The bride's family visits the groom's home, and the groom is formally accepted as the prospective husband. Gifts are exchanged, prayers are said, and sweets are distributed. This is a public and social acknowledgment that the match has been decided.

## Lagan: The Invitation

The lagan is the formal wedding invitation — traditionally written and sent to guests, with the priest's confirmation of the auspicious date included. In Maithil tradition, the lagan carries ceremonial weight beyond a simple card; it is the formal announcement to the extended family and community.

## Wedding Songs: Sohar and Geet

Music is integral to a Mithila wedding. Women of both families sing traditional songs at various points throughout the ceremonies. **Sohar** songs celebrate birth and marriage and are sung in Maithili. The songs of a Mithila wedding are not background music — they are participatory rituals in which the women of the household actively mark each stage of the ceremony.

## Kohbar: Sacred Wedding Art

The preparation of the **kohbar** — the ritual space decorated with Madhubani art for the newly married couple — is one of the most distinctive Mithila customs. Auspicious symbols (fish, lotus, peacock, bamboo and others) are painted or drawn, often by senior women of the family, each carrying specific meaning related to fertility, prosperity and the new union. Whether done in the traditional manner on walls, or adapted for modern settings, the kohbar tradition is a living expression of Mithila cultural identity.

## Vidai and Reception

The **vidai** (the farewell of the bride from her natal home) is one of the most emotionally significant moments of a Mithila wedding. Songs are sung, tears are shed, and the bride departs with blessings from her family. At the groom's home, she is welcomed with her own set of rituals, formally entering her new household.

## Evolving Traditions

Many Mithila families today combine elements of traditional practice with modern preferences. A ceremony may include both ancient Sanskrit rituals and contemporary touches. What matters most to most families is the spirit of the tradition — the sincerity, the family togetherness, and the meaningful marking of a major life transition.

---

Looking to find your match within the Mithila community? [Explore Mithila Jodi Profiles](/explore) or [Create Your Profile](/register).
$art12$,
  'Mithila Jodi Team',
  'Important Customs in a Mithila Marriage | Mithila Jodi',
  'Explore the most important customs in a Mithila marriage — from the first meeting and tilak to the kohbar tradition and vidai ceremony.',
  ARRAY['mithila marriage customs', 'mithila wedding customs', 'tilak ceremony mithila', 'kohbar tradition'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-marriage-traditions';

-- -------------------------------------------------------
-- CATEGORY 3: Mithila Culture & Heritage
-- -------------------------------------------------------

-- Article 13
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Mithila Culture? A Guide to the Land of Janaki',
  'what-is-mithila-culture',
  'Mithila is one of India''s most ancient cultural regions. Discover its history, traditions, art and what makes the Mithila community unique.',
  $art13$
## Mithila: An Ancient Land with a Living Culture

Mithila is one of the oldest cultural regions of the Indian subcontinent — a land whose history stretches back to the Vedic age and whose cultural traditions continue to be lived and celebrated by millions of people today. Whether you are encountering Mithila for the first time or are part of the community, this guide offers an introduction to what makes Mithila so distinctive.

## Where Is Mithila?

Geographically, Mithila refers to the region centred on the Gangetic plain in what is today northern Bihar and the Terai region of southern Nepal. Key cities include Darbhanga, Madhubani, Sitamarhi, Muzaffarpur, Saharsa and Supaul on the Indian side, and Janakpur (now in Province No. 2 of Nepal), which is among the most sacred sites in Mithila tradition.

The boundaries of Mithila have shifted through history, and there is no single modern administrative unit that corresponds exactly to the historical Mithila region. The community identity transcends state and national boundaries.

## The Land of Janaki

Mithila is inseparably associated with Sita — known in the region as Janaki, daughter of King Janaka of Mithila. According to the Ramayana, Sita was born in Mithila (her birthplace is traditionally identified with Sitamarhi in Bihar and the Janaki Mandir in Janakpur, Nepal). King Janaka — also known as Videha — was himself a philosopher-king whose court was famous for intellectual and spiritual discourse. The sage Yajnavalkya and the philosopher Gargi are associated with Janaka's court.

This heritage gives Mithila a special place in the broader Hindu cultural tradition — not just as a region, but as the birthplace of a figure who is central to Hindu religious life across the subcontinent.

## The Maithili Language

The living expression of Mithila culture is the [Maithili language](/blogs/mithila-culture-heritage/maithili-language-identity). Maithili is one of India's 22 constitutionally scheduled languages and has a rich literary tradition dating back to the medieval poet Vidyapati (14th–15th century), whose devotional compositions (*padas*) remain sung and cherished to this day. The language is spoken by tens of millions of people across Bihar and Nepal.

## Madhubani Art: A Visual Identity

Perhaps the single most internationally recognised element of Mithila culture is **Madhubani painting** (also called Mithila painting). This art form, historically practised by women on the walls and floors of their homes, uses geometric patterns, natural motifs and vivid colours to depict religious narratives, nature and everyday life.

Madhubani art came to international attention in the 1960s when an earthquake damaged many homes in the Madhubani district and a Government of India official noticed the extraordinary wall paintings as families rebuilt their homes. Since then, the art form has moved from walls to paper, canvas and fabric, and Mithila artists have exhibited their work internationally.

## Traditions and Festivals

Mithila has its own calendar of festivals and traditions, many of which have distinct Maithili character:

- **Sama-Chakeva** — a unique festival celebrated primarily in Mithila, involving the making of clay figurines and celebrating the bond between siblings
- **Madhushravani** — a festival observed by newly married women, with specific rituals and songs
- **Vivah Panchami** — celebrated as the wedding anniversary of Ram and Sita, particularly significant in Mithila
- The festivals of **Chhath Puja** and **Diwali** are observed with great enthusiasm and with specific Mithila traditions

## A Community Across Boundaries

Today, the Mithila community is spread far beyond its geographical origin. Mithila families live across India — in Patna, Delhi, Kolkata, Mumbai and elsewhere — and in significant numbers abroad. This diaspora has carried Mithila culture and language with it, and community associations, cultural events and institutions help maintain the connections to the homeland.

---

Mithila Jodi is a matrimonial platform built specifically for the Mithila community. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art13$,
  'Mithila Jodi Team',
  'What Is Mithila Culture? History, Art and Traditions | Mithila Jodi',
  'Discover the ancient culture of the Mithila region — its history, Maithili language, Madhubani art, festivals and community identity.',
  ARRAY['mithila culture', 'what is mithila', 'mithila heritage', 'mithila community', 'land of janaki'],
  'published',
  true,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-culture-heritage';

-- Article 14
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Maithili Language and Mithila Identity',
  'maithili-language-identity',
  'Maithili is one of India''s scheduled languages and the mother tongue of the Mithila community. Learn about the language, its literature and its role in Mithila identity.',
  $art14$
## Maithili: The Language of a Civilisation

Language is perhaps the most intimate carrier of cultural identity. For the Mithila community, that language is Maithili — a rich, ancient tongue with a literary tradition that predates many of the world's currently active literary languages.

## What Is Maithili?

Maithili is an Indo-Aryan language spoken primarily in the Mithila region of north Bihar and the Terai of southern Nepal. It is the mother tongue of tens of millions of people, and in 2003 it became the 22nd language added to the Eighth Schedule of the Indian Constitution — gaining formal recognition as one of India's official scheduled languages.

It is closely related to Bengali and Odia, and shares features with other eastern Indo-Aryan languages, while retaining a distinctly unique vocabulary, phonology and literary tradition.

## Vidyapati and the Medieval Literary Tradition

The towering figure of Maithili literature is **Vidyapati** (approximately 1352–1448 CE), a poet whose compositions in Maithili remain among the most celebrated devotional poetry in South Asian literature. Vidyapati's *padas* — lyrical poems describing the love between Radha and Krishna — are sung to this day at Mithila weddings and festivals, nearly six centuries after they were written.

Vidyapati wrote in both Maithili and Sanskrit, and his work was read and appreciated far beyond Mithila. Bengali poets drew on his imagery; the Vaishnavite tradition spread his compositions across eastern India. The depth of his influence is a testament to the literary richness of the Maithili tradition.

## Maithili in Everyday Life

For Mithila families — whether in Bihar, in Delhi, or in the diaspora abroad — Maithili remains the language of home. It is the language in which grandparents tell stories, in which the songs of weddings and festivals are sung, and in which prayers and ceremonies are conducted.

At Mithila weddings, the rituals include specific Maithili-language elements: songs, prayers and exchanges between families that preserve not just the actions of the ceremony but the language in which those actions have always been conducted. This is one reason why Maithili remains vital even as Hindi and English dominate the professional and public lives of community members.

## The Script: Mithilakshar and Devanagari

Historically, Maithili was written in its own script called **Mithilakshar** (also known as Tirhuta). This script, related to the Bengali script, was used by scholars and pandits for centuries. Today, Maithili is most commonly written in Devanagari script (the same script used for Hindi), though efforts to preserve and revive Mithilakshar are ongoing among cultural organisations and educators.

## Maithili and Identity in the Diaspora

For Mithila families who have moved far from the region — whether to other Indian cities or to other countries — Maithili language becomes a particularly important thread of identity. Teaching children Maithili, listening to Maithili songs, and speaking the language at home are ways of maintaining a connection to heritage across generations and geographies.

Many community organisations, cultural events and online communities are dedicated to preserving and promoting Maithili, recognising that the language is not just a communication tool but the vessel of an entire civilisation's memory.

---

Mithila Jodi celebrates the Mithila community and its heritage. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art14$,
  'Mithila Jodi Team',
  'Maithili Language and Mithila Identity | Mithila Jodi',
  'Learn about the Maithili language, its literary heritage, Vidyapati''s poetry, and the role of language in Mithila community identity today.',
  ARRAY['maithili language', 'mithila language', 'vidyapati', 'maithili identity', 'mithilakshar'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-culture-heritage';

-- Article 15
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Understanding Mithila Heritage: History, Art and Traditions',
  'mithila-heritage',
  'From Madhubani paintings to the birthplace of Sita, Mithila has a rich cultural heritage. Explore what makes this region and community so distinctive.',
  $art15$
## The Heritage of Mithila

Mithila's heritage is simultaneously ancient and alive. Unlike many historical cultures that survive only in texts and museums, the traditions of Mithila are practised in homes and communities today — in the songs sung at weddings, in the paintings on walls and paper, in the language spoken by grandmothers and grandchildren, and in the rituals that mark births, marriages and deaths.

## Historical Significance

The historical territory of Mithila was a centre of Vedic learning and philosophical debate. The Brihadaranyaka Upanishad records the famous dialogue of the philosopher Yajnavalkya at the court of King Janaka — a debate on the nature of the self and ultimate reality that is one of the earliest recorded philosophical discussions in human history. Mithila's identity as a land of knowledge and scholarship is not a later addition; it is woven into the oldest layers of Vedic tradition.

The city of **Janakpur** (in present-day Nepal) is identified with the capital of ancient Mithila and the birthplace of Sita. The **Janaki Mandir** there is among the most important pilgrimage sites for the Mithila community and attracts devotees from across the region and the wider Hindu world.

## Madhubani Art: A Living Tradition

**Madhubani painting** is perhaps Mithila's best-known contribution to Indian art. Originating as a domestic art practised by women on the walls of homes — particularly for auspicious occasions like weddings — Madhubani art uses bold lines, vibrant colours (traditionally derived from natural pigments) and a distinctive visual vocabulary.

The subjects of Madhubani art range from religious narratives (scenes from the Ramayana, depictions of deities) to nature (fish, birds, flowers) to social scenes. The style is immediately recognisable: flat perspective, intricate geometric borders, and a quality of joyful abundance in the compositions.

Today, Madhubani art is practiced on paper and canvas as well as walls, and Mithila artists exhibit internationally. The art form has received Geographical Indication (GI) status from the Government of India, recognising its origin in the Madhubani district of Bihar.

## The Sama-Chakeva Festival

One of the most distinctive cultural expressions unique to Mithila is the **Sama-Chakeva festival**, observed in the month of Kartik (October-November). During this festival, women and girls of the family create clay figurines of Sama (a character from Hindu mythology) and celebrate her story through songs, rituals and eventually a ritual burning of the figurines on the last day.

Sama-Chakeva is unusual in Indian festival tradition for being largely specific to the Mithila community, making it a particularly important marker of Mithila cultural identity.

## Food and Material Culture

Mithila has a rich culinary tradition as well. Dishes like **thekua** (a sweet made for Chhath Puja), **maalpua**, **dahi-chura** and various rice preparations are associated with the region. The textile traditions of the Mithila region — including certain weaving and embroidery forms — also form part of the material heritage.

## Heritage Preservation Today

Mithila's heritage is actively maintained by community organisations, cultural festivals, educational institutions and individual families. Digital platforms, social media and community events in cities outside the region play an increasingly important role in keeping this heritage alive for younger generations who may not have grown up in the Mithila belt itself.

---

Mithila Jodi is proud to serve the Mithila community. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art15$,
  'Mithila Jodi Team',
  'Understanding Mithila Heritage: History, Art and Traditions | Mithila Jodi',
  'Explore the rich heritage of the Mithila region — from its Vedic history and Madhubani art to the Sama-Chakeva festival and living cultural traditions.',
  ARRAY['mithila heritage', 'madhubani art', 'mithila history', 'sama-chakeva', 'mithila traditions'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'mithila-culture-heritage';

-- -------------------------------------------------------
-- CATEGORY 4: Matrimonial & Marriage Guide
-- -------------------------------------------------------

-- Article 16
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'How to Create a Good Matrimonial Biodata',
  'how-to-create-matrimonial-biodata',
  'A matrimonial biodata is your family''s introduction to potential matches. Learn what makes a strong biodata and how to present your profile well.',
  $art16$
## What Is a Matrimonial Biodata?

A matrimonial biodata is a document that introduces you — and your family — to a potential match and their family. In the Mithila matrimonial tradition, the biodata is often the first formal introduction before any meeting takes place. It sets the tone for how a family is perceived and gives the other party the information they need to decide whether to explore the match further.

Think of it as a professional profile — but for one of life's most important decisions. A well-prepared biodata reflects care, sincerity and transparency.

## What Should a Mithila Matrimonial Biodata Include?

### Personal Details
- Full name
- Date and place of birth
- [Rashi (moon sign)](/blogs/horoscope-marriage/what-is-rashi) and [nakshatra (birth star)](/blogs/horoscope-marriage/what-is-nakshatra) — important for horoscope matching
- [Manglik status](/blogs/horoscope-marriage/what-is-manglik) — if known
- Height and complexion (commonly included, though this is a personal choice)
- Mother tongue (Maithili, Hindi, etc.)
- Religion and community (e.g., Maithil Brahmin, Kayastha, etc.)

### Family Lineage
- [Gotra](/blogs/gotra-family-lineage/what-is-gotra) (paternal)
- [Maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra)
- [Mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila) (ancestral origin)
- [Gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila) (native village)

These four details are fundamental to a Mithila matrimonial biodata and are typically among the first things other families will check.

### Education and Career
- Educational qualifications (degree, institution, year)
- Current occupation and employer
- Location (city/country of current residence)

### Family Background
- Father's name and occupation
- Mother's name and occupation
- Siblings (brothers/sisters, their education/occupation and married status)
- Family type (joint/nuclear) and nature (values, lifestyle)

### What You Are Looking For
- Age range preferred
- Preferred location
- Any specific requirements or preferences

## Presentation Matters

- **Be honest.** Do not exaggerate qualifications, income, or family background. Information is verified during the process, and inconsistencies damage trust.
- **Be clear.** Use straightforward language. A biodata is not an advertisement — it is an introduction.
- **Be complete.** Missing key details (especially gotra, mool, gram) forces the other family to ask, which creates friction. Include everything.
- **Include a recent photograph.** A clear, recent, natural-looking photograph is standard. Heavily edited photographs can create unrealistic expectations.

## Common Mistakes to Avoid

- Vague or evasive descriptions of family background
- Outdated photographs
- Missing lineage information (gotra, mool, gram)
- Inconsistencies between the biodata and information shared later
- Overly long documents — a good biodata is typically one page (or its equivalent in a digital profile)

---

Mithila Jodi's profile system is designed to capture all the information that matters in a Mithila matrimonial search — including gotra, mool, gram and horoscope details. **[Create Your Profile on Mithila Jodi](/register)** and let families find you with the right information already in place.
$art16$,
  'Mithila Jodi Team',
  'How to Create a Good Matrimonial Biodata | Mithila Jodi',
  'A step-by-step guide to creating a strong matrimonial biodata for the Mithila community — what to include, how to present it, and common mistakes to avoid.',
  ARRAY['matrimonial biodata', 'how to create biodata', 'mithila biodata', 'matrimonial profile mithila'],
  'published',
  true,
  now()
FROM blog_categories c WHERE c.slug = 'matrimonial-marriage-guide';

-- Article 17
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Information Should a Matrimonial Profile Include?',
  'matrimonial-profile-information',
  'A complete matrimonial profile helps families make informed decisions. Discover what details matter most and how to present them clearly.',
  $art17$
## The Purpose of a Matrimonial Profile

A matrimonial profile is the starting point of a conversation. Its purpose is to give enough accurate, relevant information for another family to decide whether they want to explore a potential match further. It is not a place to hide things — nor is it a place to include everything about a person's life. The goal is the right information, presented clearly.

## Essential Information Categories

### 1. Identity and Personal Details

This is the most basic layer — who the person is:

- **Full name**
- **Age and date of birth** — important for astrological matching
- **Height** — commonly included in South Asian matrimonial profiles
- **Place of birth and current location**
- **Citizenship/residency status** — particularly relevant for diaspora matches

### 2. Community and Lineage

For a Mithila matrimonial profile, this section is particularly important:

- **Sub-community / caste** (e.g., Maithil Brahmin, Kayastha)
- **[Gotra](/blogs/gotra-family-lineage/what-is-gotra)** — paternal lineage
- **[Maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra)** — mother's natal family gotra
- **[Mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila)** — ancestral origin
- **[Gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila)** — native village

Without these details, Mithila families cannot complete the preliminary compatibility check, which means the profile is less useful.

### 3. Horoscope Information

- **[Rashi](/blogs/horoscope-marriage/what-is-rashi)** (moon sign)
- **[Nakshatra](/blogs/horoscope-marriage/what-is-nakshatra)** (birth star)
- **[Manglik status](/blogs/horoscope-marriage/what-is-manglik)** — if known
- Willingness to share the full horoscope on request

### 4. Education and Career

- Highest educational qualification and field of study
- Current occupation, industry and employer
- Income range (optional, but valued by many families)
- Career plans or future goals (optional, but gives context)

### 5. Family Background

- Parents' names, occupations and background
- Siblings (number, gender, their marital status and occupation)
- Family type (joint/nuclear) and values
- Property or home situation (optional)

### 6. Personal Attributes and Interests

- Brief description of personality and values
- Hobbies and interests
- Lifestyle (diet, social habits)
- Languages spoken

### 7. What You Are Looking For

This is often underused but genuinely valuable:

- Preferred age range
- Preferred location
- Key qualities sought in a partner
- Any specific requirements (e.g., willing to relocate, looking for a working/non-working partner)

## A Note on Photographs

A recent, clear photograph is standard in matrimonial profiles. Natural lighting, a neutral background and an honest representation serve best. Heavy filters or photographs from years ago create unrealistic impressions — which ultimately wastes everyone's time.

---

Mithila Jodi profiles are structured to capture all the information families need for the Mithila matrimonial process. [Create Your Profile](/register) or [Explore Profiles](/explore).
$art17$,
  'Mithila Jodi Team',
  'What Should a Matrimonial Profile Include? | Mithila Jodi',
  'A complete guide to what information to include in a matrimonial profile for the Mithila community — from gotra and lineage details to education and personal attributes.',
  ARRAY['matrimonial profile information', 'what to include biodata', 'mithila matrimonial profile', 'marriage profile details'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'matrimonial-marriage-guide';

-- Article 18
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Important Questions Families Should Discuss Before Marriage',
  'family-questions-before-marriage',
  'Before finalising a match, families need to discuss many important matters. This guide covers the key topics families should address openly.',
  $art18$
## Why These Conversations Matter

The period between identifying a potential match and finalising a marriage is one of the most important in the entire process. It is the time when families — and the prospective couple — learn enough about each other to make a genuinely informed decision. Rushing through this phase, or avoiding difficult questions to seem agreeable, can lead to misunderstandings that surface only after the wedding.

This guide offers a framework for the conversations that matter most. Not all topics will apply to every family, and the depth of each conversation will vary. The goal is to approach this phase with both openness and care.

## Lineage and Community Compatibility

The first set of questions is about lineage — checking that the [gotra, mool and gram](/blogs/gotra-family-lineage/mithila-family-lineage) are compatible and that there are no close family connections between the two families. This is typically done early in the process and is a prerequisite for most Mithila families before any further discussion.

If the families have done a horoscope comparison, the findings and how each family weighs them should be discussed openly. Views on [kundli matching](/blogs/horoscope-marriage/kundli-matching-explained) and [manglik considerations](/blogs/horoscope-marriage/what-is-manglik) vary widely — clarity early avoids friction later.

## Living Arrangements

Where will the couple live? This is one of the most practical questions and one that can significantly affect daily life:

- Joint family or nuclear family arrangement?
- If joint family, what are the expectations of the new bride's role in the household?
- If the groom is in another city or country, what are the plans for the couple's residence?
- Whose career takes precedence if relocation decisions need to be made?

These are not hypothetical questions — they are concrete realities that both sides should understand and agree on.

## Career and Financial Matters

- Is the bride expected to work after marriage? Does the family have a preference?
- What is the groom's current financial situation and earning trajectory?
- How will household finances be managed?
- Are there any significant financial commitments (loans, family obligations) the other family should know about?

Money conversations can feel uncomfortable, but they are far better addressed before the wedding than after.

## Family Expectations and Values

- What are the expectations around festivals, family visits and social commitments?
- How does the family approach religion and tradition — strictly observant, moderately, or largely secular?
- What are the family's views on extended family support and obligations?
- Are there any health considerations in either family that are relevant to share?

## Children and Future Plans

- What are the respective views on having children — timing, number?
- If the couple is older or there are fertility considerations, is this a topic either family wants to address?
- What are the plans for children's education and upbringing?

## Getting to Know the Individual

Beyond the family discussion, the prospective bride and groom should have the opportunity to meet — ideally more than once — and to get to know each other as individuals. Questions worth exploring between the two:

- What are each person's long-term goals and values?
- What kind of life do they envision together?
- What matters most to them in a partner?

## A Note on Honesty

The best matrimonial discussions are honest ones. Families that present themselves accurately — including the less glamorous details — create the conditions for a genuinely good match. Misrepresentation may seem to help in the short term, but it creates the conditions for disappointment and broken trust.

---

Mithila Jodi supports families through the entire matrimonial process. [Explore Profiles](/explore) or [Create Your Profile](/register) to get started.
$art18$,
  'Mithila Jodi Team',
  'Important Questions Families Should Discuss Before Marriage | Mithila Jodi',
  'A practical guide to the key conversations families should have before finalising a matrimonial match — from lineage and living arrangements to finances and values.',
  ARRAY['questions before marriage', 'family discussions before marriage', 'mithila marriage questions', 'matrimonial process'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'matrimonial-marriage-guide';

-- -------------------------------------------------------
-- CATEGORY 5: Horoscope & Marriage
-- -------------------------------------------------------

-- Article 19
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Rashi? Moon Signs in Hindu Matrimonial Matching',
  'what-is-rashi',
  'Rashi is the moon sign in Hindu astrology and plays an important role in matrimonial compatibility. Learn what rashi means and how it is used in marriage matching.',
  $art19$
## What Is Rashi?

In Hindu astrology (Jyotisha), *rashi* refers to the zodiac sign occupied by the Moon at the moment of a person's birth. It is often translated as "moon sign" to distinguish it from the Western astrological concept of a sun sign (which is determined by the position of the Sun, not the Moon).

There are 12 rashis in Hindu astrology, corresponding to the 12 signs of the zodiac:

1. Mesh (Aries)
2. Vrishabh (Taurus)
3. Mithun (Gemini)
4. Kark (Cancer)
5. Simha (Leo)
6. Kanya (Virgo)
7. Tula (Libra)
8. Vrishchik (Scorpio)
9. Dhanu (Sagittarius)
10. Makar (Capricorn)
11. Kumbh (Aquarius)
12. Meen (Pisces)

## How Is Rashi Determined?

Rashi is calculated from the birth chart (kundli or janam patri), based on the exact date, time and place of birth. Because the Moon moves relatively quickly through the zodiac (roughly 2.5 days per sign), knowing only the birth date is often not precise enough to determine rashi — the time and place of birth matter.

A Hindu calendar (panchang) can be used to look up the Moon's position at any given time, or a priest or astrologer can calculate it from the birth details.

## Rashi in Matrimonial Matching

Rashi plays a significant role in [kundli matching (kundali milan)](/blogs/horoscope-marriage/kundli-matching-explained) for marriage. One of the most widely used systems for assessing matrimonial compatibility is the **Ashtakoota (eight-factor) system**, in which the rashi of the bride and groom is used to calculate several of the eight compatibility scores.

A particularly important factor derived from rashi is **Bhakoot** — one of the eight factors in Ashtakoota, carrying 7 of the total 36 points. Certain rashi combinations in Bhakoot are considered more compatible than others, and some are considered potentially challenging (though views on this vary between astrologers and families).

Rashi is also connected to [nakshatra (birth star)](/blogs/horoscope-marriage/what-is-nakshatra), which is the other major astrological identifier used in marriage matching.

## How Much Weight Should Rashi Matching Carry?

This is a question on which families, priests, astrologers and communities differ significantly. For some families, a favourable rashi match is a necessary condition for proceeding with a match. For others, it is one consideration among many — to be balanced against the personal compatibility, family background, education and values of the potential match.

As with all aspects of matrimonial astrology, how much weight to give rashi matching is ultimately a personal and family decision. What matters is that both families have a shared understanding of how they are approaching this factor before any serious commitment is made.

---

Mithila Jodi profiles include rashi and nakshatra information. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art19$,
  'Mithila Jodi Team',
  'What Is Rashi? Moon Signs in Hindu Matrimonial Matching | Mithila Jodi',
  'Learn what rashi (moon sign) means in Hindu astrology and how it is used in matrimonial compatibility matching, including kundli milan.',
  ARRAY['rashi', 'what is rashi', 'moon sign hinduism', 'rashi marriage matching', 'rashi kundli'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'horoscope-marriage';

-- Article 20
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Nakshatra? Birth Stars and Marriage Compatibility',
  'what-is-nakshatra',
  'Nakshatra is the birth star in Hindu astrology. Understand the 27 nakshatras and their role in kundli matching for marriage.',
  $art20$
## What Is Nakshatra?

In Hindu astrology, the sky is divided not only into 12 zodiac signs (rashis) but also into 27 (or sometimes 28) lunar mansions called **nakshatras**. The nakshatra is the specific lunar mansion in which the Moon was positioned at the moment of a person's birth. It is sometimes translated as "birth star."

While [rashi (moon sign)](/blogs/horoscope-marriage/what-is-rashi) tells you which broad zodiac sign the Moon occupied, the nakshatra is more precise — each of the 27 nakshatras spans approximately 13 degrees and 20 minutes of the zodiac, providing a finer-grained astrological identifier.

## The 27 Nakshatras

The 27 nakshatras are:

Ashwini, Bharani, Krittika, Rohini, Mrigashirsha, Ardra, Punarvasu, Pushya, Ashlesha, Magha, Purva Phalguni, Uttara Phalguni, Hasta, Chitra, Swati, Vishakha, Anuradha, Jyeshtha, Mula, Purva Ashadha, Uttara Ashadha, Shravana, Dhanishtha, Shatabhisha, Purva Bhadrapada, Uttara Bhadrapada, Revati.

Each nakshatra has a ruling deity, a ruling planet, and associated qualities — a rich astrological system that has been developed and refined over thousands of years.

## Nakshatra in Marriage Matching

Nakshatra is central to the most important compatibility factor in the **Ashtakoota (eight-factor) matching** system used widely in North India: **Nadi dosha**.

Nadi is a classification of nakshatras into three groups — Adi (first), Madhya (middle), and Antya (last). In Ashtakoota, the bride and groom should have different Nadi classifications, as same-Nadi matches are considered to carry a Nadi dosha — a challenge in the compatibility. Nadi carries 8 points out of 36 in the Ashtakoota system, the highest weight of any single factor.

Additionally, the nakshatra of the groom is compared with the nakshatra of the bride to determine **Tara koota** (compatibility of birth stars), another of the eight factors.

## Nadi Dosha: A Note on Variation

Nadi dosha is one of the most discussed — and debated — aspects of matrimonial astrology. Some families and astrologers consider it a serious concern; others believe that other strong compatibility factors can counterbalance it. Some authorities hold that Nadi dosha does not apply in certain nakshatra combinations or community traditions.

As with other aspects of astrological matching, views differ. If Nadi dosha comes up in a compatibility discussion, consulting a knowledgeable astrologer for a detailed reading — rather than relying on a simple online calculator — is advisable.

## Nakshatra as Personal Identity

Beyond marriage matching, the nakshatra is used in many Hindu traditions as a personal spiritual identifier. Naming ceremonies, religious rituals and certain auspicious events may reference the nakshatra. Some families use the nakshatra in the child's naming (the first letter of the name is chosen based on the nakshatra's associated syllables).

---

Mithila Jodi profiles include nakshatra information alongside rashi and other details. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art20$,
  'Mithila Jodi Team',
  'What Is Nakshatra? Birth Stars and Marriage Compatibility | Mithila Jodi',
  'Learn about nakshatra (birth stars) in Hindu astrology, the 27 nakshatras, and how they are used in kundli matching including Nadi dosha.',
  ARRAY['nakshatra', 'what is nakshatra', 'birth star hinduism', 'nakshatra marriage', 'nadi dosha', 'nakshatra matching'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'horoscope-marriage';

-- Article 21
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'What Is Manglik? Understanding Mangal Dosha in Marriage',
  'what-is-manglik',
  'Manglik or Mangal Dosha is a significant consideration in Hindu marriage astrology. Learn what it means, how it is assessed, and the different views within the community.',
  $art21$
## What Is Mangal Dosha?

**Mangal Dosha** (also called Manglik dosha, Kuja dosha, or Chevvai dosham in different regional traditions) is a term from Hindu Jyotisha (astrology) referring to a specific placement of Mars (Mangal) in a person's birth chart. A person with this placement is often referred to as **Manglik**.

It is one of the most widely known and widely discussed — and also widely misunderstood — concepts in Hindu matrimonial astrology.

## How Is Mangal Dosha Determined?

In Vedic astrology, a person is said to have Mangal Dosha when Mars is placed in certain houses in their birth chart. The specific houses considered to create the dosha vary somewhat by tradition, but the most commonly cited are the 1st, 2nd, 4th, 7th, 8th and 12th houses from the ascendant (lagna). Some traditions also consider Mars's placement from the Moon or Venus.

Because different astrologers count different houses and apply different exceptions, the assessment of whether someone has Mangal Dosha — and how strong it is — can vary significantly between astrologers. This is an important practical point: two astrologers examining the same birth chart may give different assessments.

## What Does the Tradition Say?

In the tradition, Mangal Dosha in the chart of one partner is considered to create an imbalance in the relationship unless the other partner also has Mangal Dosha (in which case, the doshas are said to cancel each other out). The concern is most often expressed in relation to marital harmony and the health and longevity of the spouse.

The severity attributed to Mangal Dosha ranges widely in astrological literature. Some texts treat it as a significant consideration; others emphasise that many factors in a chart can mitigate or cancel it, including:

- Certain planetary aspects or conjunctions (e.g., Mars with Jupiter, which some astrologers consider a cancellation)
- Specific nakshatras or rashi placements
- Mars placed in its own sign or exalted
- The strength and overall nature of the chart

## Views Within the Community

It is important to be honest about how varied the views on Mangal Dosha are, even within Hindu communities:

**Some families consider it very seriously.** For these families, a confirmed Mangal Dosha in one partner's chart without a corresponding Mangal Dosha in the other's is a significant concern, and they may not proceed with a match unless the dosha is cancelled or remedies are performed.

**Other families take a more moderate position.** They may note the Mangal Dosha but weigh it alongside other factors in the chart and in the overall match. A strong compatibility in other respects may be seen as balancing a weaker concern.

**Some families and individuals do not consider it at all.** Among educated, urban and non-observant families, Mangal Dosha may be mentioned but not treated as a determining factor.

There is no single authoritative position that applies to all Hindu or Mithila families. This is an area where clarifying each family's approach early in the matrimonial process prevents later misunderstanding.

## A Practical Note

If Mangal Dosha has come up in the context of your matrimonial search, the best approach is:

1. Get a detailed reading from a qualified astrologer — not just an online calculator.
2. Understand whether there are cancellation factors in your specific chart.
3. Discuss openly with the other family how they view Mangal Dosha, rather than assuming a shared position.

The tradition around Mangal Dosha is a genuine and meaningful part of Hindu astrological practice. It is also an area where individual assessment, family values and the overall quality of a match all need to be weighed together.

---

Mithila Jodi allows profiles to include horoscope information including manglik status. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art21$,
  'Mithila Jodi Team',
  'What Is Manglik? Understanding Mangal Dosha in Marriage | Mithila Jodi',
  'Learn what Mangal Dosha (Manglik) means in Hindu astrology, how it is assessed, and how different families approach it in matrimonial matching.',
  ARRAY['manglik', 'mangal dosha', 'what is manglik', 'manglik marriage', 'kuja dosha', 'manglik dosha'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'horoscope-marriage';

-- Article 22
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Kundli Matching Explained for Beginners',
  'kundli-matching-explained',
  'Kundli matching (kundali milan) is the practice of comparing birth charts before marriage. This beginner''s guide explains what it involves and what families look for.',
  $art22$
## What Is Kundli Matching?

**Kundli matching** — also called **kundali milan**, **gun milan** or **horoscope matching** — is the practice of comparing the birth charts (kundlis or janam patris) of a prospective bride and groom to assess their astrological compatibility before marriage. It is widely practised across Hindu communities in India and the diaspora.

A kundli (birth chart) is a map of the sky at the exact moment and place of a person's birth, showing the positions of the Sun, Moon and planets across the 12 houses and 12 zodiac signs. Two kundlis can be compared in several ways; the most widely used system in North India is the **Ashtakoota (eight-factor) system**.

## The Ashtakoota System

The Ashtakoota system compares eight specific compatibility factors (koota) derived from the [rashi (moon sign)](/blogs/horoscope-marriage/what-is-rashi) and [nakshatra (birth star)](/blogs/horoscope-marriage/what-is-nakshatra) of the bride and groom. Each factor carries a certain number of points, totalling 36 points in all.

| Factor | Points | What It Indicates |
|---|---|---|
| Varna (1 pt) | 1 | Spiritual compatibility |
| Vashya (2 pts) | 2 | Mutual attraction and control |
| Tara (3 pts) | 3 | Birth star compatibility, health |
| Yoni (4 pts) | 4 | Physical and intimate compatibility |
| Graha Maitri (5 pts) | 5 | Mental compatibility, friendship |
| Gana (6 pts) | 6 | Nature and temperament |
| Bhakoot (7 pts) | 7 | Love, family, prosperity |
| Nadi (8 pts) | 8 | Health, progeny |

**Total: 36 points**

The score achieved out of 36 is used as a general guide:
- 18 or below: Often considered not suitable (varies by astrologer)
- 18–24: Acceptable
- 24–32: Good
- 32–36: Excellent

These ranges are general guidelines; different astrologers and families apply them differently.

## Beyond Gun Milan: The Full Kundli Reading

Gun milan (the eight-factor scoring) is the most commonly discussed part of kundli matching, but a thorough astrological assessment goes further:

- **Dosha analysis:** Checking for Mangal Dosha, Nadi dosha, and other concerns in each chart
- **7th house analysis:** The 7th house in a birth chart relates to marriage and partnership — its strength and the planets placed in it are examined
- **Overall chart compatibility:** The interaction of both charts, including the placement of Venus and Jupiter (significators of love and marriage), is considered

A full kundli reading by a qualified astrologer provides a much richer picture than a simple online gun milan score.

## How Much Weight Should Kundli Matching Carry?

This varies enormously between families. For some, a favourable kundli match is a near-requirement for proceeding. For others, it is one consideration alongside personal compatibility, family background and education. Some families in modern urban settings may not consult horoscopes at all.

There is no right or wrong approach here — the tradition of kundli matching is meaningful and respected within Hindu culture. What matters is that both families are clear about how much weight they give it, so there are no surprises during the matching process.

---

Mithila Jodi profiles include rashi, nakshatra and manglik details to support families who do kundli matching. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art22$,
  'Mithila Jodi Team',
  'Kundli Matching Explained for Beginners | Mithila Jodi',
  'A beginner''s guide to kundli matching (kundali milan) — the Ashtakoota system, the eight compatibility factors, scores and how families use horoscope matching in marriage.',
  ARRAY['kundli matching', 'kundali milan', 'gun milan', 'horoscope matching marriage', 'ashtakoota'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'horoscope-marriage';

-- -------------------------------------------------------
-- CATEGORY 8: Biodata & Matrimonial Tips
-- -------------------------------------------------------

-- Article 23
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'How to Write an Effective Matrimonial Profile',
  'effective-matrimonial-profile',
  'Your matrimonial profile is often the first impression you make on potential families. Learn how to write a profile that is genuine, clear and appealing.',
  $art23$
## Your Profile Is Your Introduction

In matrimonial searching, the profile does a job that used to be done by a common acquaintance — it introduces you to a family who does not know you yet. A good profile creates genuine interest and makes it easy for the right family to see why a meeting would be worthwhile. A poor profile either buries the relevant information or creates an impression that does not match reality.

Here is how to write a profile that works.

## Lead With the Essentials

The first thing a Mithila family wants to know is whether the basics are compatible. Make it easy for them:

- Name, age and current location
- [Gotra](/blogs/gotra-family-lineage/what-is-gotra) and [maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra)
- [Mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila) and [gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila)
- [Rashi](/blogs/horoscope-marriage/what-is-rashi) and [nakshatra](/blogs/horoscope-marriage/what-is-nakshatra)

If these details are not immediately visible, many families will move on rather than search through a long profile to find them. Put them at the top.

## Write a Genuine Personal Description

The personal description section is where profiles too often go wrong — either with a list of adjectives that mean nothing ("fun-loving, family-oriented, ambitious") or with a formal third-person biography that reads like a corporate press release.

Instead, write a short paragraph (three to five sentences) that actually tells someone something specific about the person:

- What they do and care about professionally
- What matters to them personally
- What kind of life they are building and looking for

Be specific. "Works as a software engineer in Bengaluru, interested in classical music and cooking Maithili food on weekends" tells a family something real. "A simple person who values family" tells them nothing.

## Be Honest About Your Situation

If there are circumstances the other family needs to know — previous marriage, children, a health consideration, living arrangement preferences — include them. Families that discover undisclosed information later feel misled, and it makes a difficult conversation much harder. Honesty upfront is a sign of respect for the other party's time and decision-making.

## The Photograph Matters

A clear, recent photograph taken in good light with a neutral background is standard. The photograph should reflect how you actually look today — not several years ago, not heavily filtered, not cropped from a group event. First impressions matter, and an honest photograph sets realistic expectations for the first meeting.

## Describe Your Family Background

Many families make their decision based as much on family background as on the individual. Include:

- Parents' occupations and background
- Siblings and their status
- Family type and values

Keep this section factual and warm — it is not a list of qualifications, it is an introduction to the family the other family will be connecting with.

## State What You Are Looking For

A surprisingly underused but genuinely useful section: what kind of match are you looking for? Age range, preferred location, working or non-working preference, lifestyle considerations. Being specific saves everyone time and creates better matches.

---

Mithila Jodi's profile system makes it easy to capture all the right information. **[Create Your Profile on Mithila Jodi](/register)** and let families find you with the details they need already in place. Already have a profile? [Explore Profiles](/explore) to search for compatible matches.
$art23$,
  'Mithila Jodi Team',
  'How to Write an Effective Matrimonial Profile | Mithila Jodi',
  'Tips for writing a clear, honest and effective matrimonial profile that gives families the right information and creates genuine interest.',
  ARRAY['effective matrimonial profile', 'how to write matrimonial profile', 'mithila profile tips', 'biodata writing'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'biodata-matrimonial-tips';

-- Article 24
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'Common Mistakes in Matrimonial Biodata and How to Avoid Them',
  'matrimonial-biodata-mistakes',
  'Many families unknowingly make mistakes in their matrimonial biodata. Discover the most common errors and how to present your profile professionally.',
  $art24$
## Why Small Mistakes in a Biodata Matter

A matrimonial biodata is a brief document, but the impression it creates can be lasting. A biodata that is incomplete, misleading or carelessly prepared signals to the other family that the same lack of care may apply elsewhere. Conversely, a well-prepared biodata reflects the seriousness and respect with which a family approaches the matrimonial process.

Here are the most common mistakes — and how to avoid them.

## Mistake 1: Missing Lineage Information

For a Mithila family, the absence of [gotra](/blogs/gotra-family-lineage/what-is-gotra), [maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra), [mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila) and [gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila) on a biodata is a significant gap. Without these, the other family cannot complete the preliminary compatibility check and will either have to ask (creating friction and delay) or may simply move on.

**Fix:** Include all four lineage identifiers prominently — ideally in a dedicated section at the top of the biodata.

## Mistake 2: An Outdated Photograph

A photograph from five years ago, taken at a relative's wedding and cropped from a group, is not a useful photograph for a matrimonial biodata. Neither is one that has been heavily edited or filtered.

**Fix:** Use a recent photograph, taken in the last six months, in good natural light, with a plain background. Smile naturally. It should look like you.

## Mistake 3: Vague or Hollow Descriptions

"A simple, family-oriented person who loves to travel and spend time with family" — this could describe anyone and tells the reader nothing useful.

**Fix:** Be specific. What do you do professionally? What are your genuine interests? What kind of life are you building? Two or three specific sentences are worth more than a paragraph of adjectives.

## Mistake 4: Inflated or Misleading Information

Exaggerated income figures, a designation that sounds more senior than the actual role, a qualification that has been slightly embellished — these are the kinds of small exaggerations that seem harmless on the biodata but create problems later. Families do their research, and inconsistencies between the biodata and reality damage trust at exactly the wrong moment.

**Fix:** Be accurate. If your situation is modest, a family that is a genuine match will not be deterred by honesty. One that would be deterred is probably not the right match.

## Mistake 5: Omitting What Matters to You

Many biodatas are entirely descriptive — they tell you what the person is but not what they are looking for. A biodata with no sense of the person's preferences and priorities is less useful than it could be.

**Fix:** Include a brief "Looking For" section. State your preferred age range, whether location matters, and any values or lifestyle factors that are important to you. This helps compatible families identify themselves and saves everyone's time.

## Mistake 6: Ignoring the Family Section

The matrimonial process in Mithila involves two families, not just two individuals. A biodata that presents the individual thoroughly but gives almost no information about the family is incomplete.

**Fix:** Include parents' occupations and background, the number and status of siblings, and a brief sense of the family's values and lifestyle. Keep it concise but real.

## Mistake 7: A Disorganised Format

A biodata that requires the reader to hunt through paragraphs of prose to find the date of birth, gotra or educational qualification is harder to use than one that is clearly structured.

**Fix:** Use a clear, organised layout — a brief personal introduction, then structured sections for lineage, personal details, education/career, family background, and what you are looking for. The reader should be able to find any piece of information in under ten seconds.

---

Mithila Jodi's profile system is structured to capture all the right information in the right order. [Create Your Profile](/register) to get started.
$art24$,
  'Mithila Jodi Team',
  'Common Mistakes in Matrimonial Biodata and How to Avoid Them | Mithila Jodi',
  'Discover the most common mistakes families make in matrimonial biodatas and how to avoid them for a professional, effective profile.',
  ARRAY['matrimonial biodata mistakes', 'biodata errors', 'matrimonial profile mistakes', 'how to improve biodata'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'biodata-matrimonial-tips';

-- Article 25
INSERT INTO blog_posts
  (category_id, title, slug, excerpt, content, author_name, seo_title, seo_description, keywords, status, featured, published_at)
SELECT
  c.id,
  'How Families Can Evaluate a Matrimonial Profile',
  'evaluate-matrimonial-profile',
  'Reviewing a matrimonial profile carefully helps families make thoughtful decisions. This guide covers what to look for when assessing a potential match.',
  $art25$
## Reading a Matrimonial Profile Carefully

Receiving a matrimonial biodata or reviewing a profile on a matrimonial platform is the beginning of a research process, not a final decision. A thoughtful evaluation helps families quickly identify genuine potential matches and avoid wasting time on ones that are unlikely to work — all while remaining respectful of the other family.

Here is a framework for evaluating a profile systematically.

## Step 1: Lineage Compatibility

The first check for a Mithila family is lineage. Does the profile include:

- [Gotra](/blogs/gotra-family-lineage/what-is-gotra) (paternal gotra)?
- [Maternal gotra](/blogs/gotra-family-lineage/what-is-maternal-gotra)?
- [Mool](/blogs/gotra-family-lineage/what-is-mool-in-mithila)?
- [Gram](/blogs/gotra-family-lineage/what-is-gram-in-mithila)?

Compare these with your own family's details. Do any of the gotras match in a way that raises a lineage concern? Is there a potential connection through mool or gram that suggests the families may be closely related?

If lineage information is missing from the profile, it is reasonable to ask for it before proceeding further.

## Step 2: Basic Compatibility Filters

Once lineage is clear, the next set of checks involves practical compatibility:

- **Age:** Is the age range appropriate?
- **Location:** Is current location compatible with your family's expectations about where the couple will live?
- **Education and occupation:** Does the professional profile align with your expectations?

These are filters, not deep assessments. The goal is to quickly rule out profiles that are clearly not a fit on practical grounds, so your attention can go to the ones that have genuine potential.

## Step 3: Horoscope Details

If your family does [kundli matching](/blogs/horoscope-marriage/kundli-matching-explained), check whether the profile includes [rashi](/blogs/horoscope-marriage/what-is-rashi), [nakshatra](/blogs/horoscope-marriage/what-is-nakshatra) and [manglik status](/blogs/horoscope-marriage/what-is-manglik). A preliminary rashi and nakshatra check can be done from the profile details. A full kundli comparison would typically happen after the families have expressed mutual interest.

## Step 4: Family Background

Read the family background section carefully. What do the parents do? What is the family's general background? Are there siblings, and what are their circumstances? Does the family type (joint or nuclear) match what your family expects?

The family background tells you not just about the individual but about the environment they come from and the values they are likely to carry.

## Step 5: The Personal Description

The personal description section — when well written — tells you something about the person's character, interests and priorities. Read it for specificity and genuineness. Generic phrases that could apply to anyone are less useful than specific details that tell you something real about the individual.

## Step 6: What They Are Looking For

If the profile includes a "looking for" or "partner preference" section, read it carefully. Does what they are looking for align with who you are? Are there expectations mentioned that would be a challenge for your family?

## Practical Next Steps

After evaluating a profile positively, the typical next step is an informal inquiry — often through the platform, a mutual contact, or a brief phone call between families. This is the moment to ask about any missing information and to gauge whether the other family is genuinely interested.

A good evaluation process helps you spend your time and energy on profiles that have real potential — and helps you approach every interaction with the respect the process deserves.

---

Mithila Jodi profiles are structured to make evaluation straightforward — with lineage, horoscope and family details all in one place. [Explore Profiles](/explore) or [Create Your Profile](/register).
$art25$,
  'Mithila Jodi Team',
  'How Families Can Evaluate a Matrimonial Profile | Mithila Jodi',
  'A step-by-step guide for families on how to evaluate a matrimonial profile — from lineage and horoscope checks to family background and personal compatibility.',
  ARRAY['evaluate matrimonial profile', 'how to assess biodata', 'matrimonial profile evaluation', 'mithila match evaluation'],
  'published',
  false,
  now()
FROM blog_categories c WHERE c.slug = 'biodata-matrimonial-tips';
