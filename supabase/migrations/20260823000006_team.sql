-- Team members table and storage for the About page.
-- Managed entirely through the admin panel; photos are uploaded there.

CREATE TABLE public.team_members (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name       text        NOT NULL,
  role               text        NOT NULL,
  bio                text,
  responsibilities   text[]      NOT NULL DEFAULT '{}',
  photo_storage_path text,
  display_order      smallint    NOT NULL DEFAULT 0,
  is_enabled         boolean     NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- All reads and writes go through service role (createAdminClient) which bypasses RLS.
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Public storage bucket for team photos (readable by everyone, writable only via service role).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-photos',
  'team-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "team_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'team-photos');

-- Seed: founding team members (photos uploaded via admin panel after launch).
INSERT INTO public.team_members (display_name, role, bio, responsibilities, display_order) VALUES
(
  'Babita Jha & Manoj Jha',
  'Founders & CEOs',
  'Babita and Manoj founded Mithila Jodi with a shared belief that matrimonial matchmaking for the Mithila community should honour family traditions, cultural values, and the specific context of Maithili marriage practice.',
  ARRAY[
    'Overall vision and leadership',
    'Business strategy',
    'Mithila community relationships',
    'Family focused product direction',
    'Partnerships and long term growth'
  ],
  1
),
(
  'Amit Jha',
  'Head of Technology',
  'Amit leads the technology behind Mithila Jodi — from the platform architecture and security to the tools that help families create and share marriage biodatas.',
  ARRAY[
    'Technology strategy',
    'Website and platform development',
    'Infrastructure',
    'Security',
    'Technical reliability',
    'Product technology'
  ],
  2
),
(
  'Janaki Jha',
  'Head of Marketing & Community',
  'Janaki shapes how Mithila Jodi communicates with the Maithili community — through brand storytelling, content, and engagement that feels authentic to Mithila culture.',
  ARRAY[
    'Brand strategy',
    'Marketing',
    'Social media',
    'Content',
    'Community engagement',
    'User awareness and communication'
  ],
  3
),
(
  'Sumit Jha',
  'Head of Operations & User Experience',
  'Sumit ensures that the experience on Mithila Jodi is smooth, trustworthy, and well supported — from profile quality to day-to-day member operations.',
  ARRAY[
    'User operations',
    'Profile quality',
    'Verification processes',
    'User support',
    'Operational workflows',
    'Improving the overall member experience'
  ],
  4
),
(
  'Sandeep Jha',
  'Head of Partnerships & Growth',
  'Sandeep builds the community connections and relationships that help Mithila Jodi grow as a trusted platform for Mithila families across India.',
  ARRAY[
    'Community partnerships',
    'Strategic relationships',
    'Outreach',
    'Growth initiatives',
    'Institutional and community collaboration'
  ],
  5
);
