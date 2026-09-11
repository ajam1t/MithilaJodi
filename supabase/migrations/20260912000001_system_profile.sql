-- The official "Mithila Jodi" identity, so an admin can message a member.
--
-- Conversations are strictly profile-to-profile (conversations.profile_a and
-- profile_b are both NOT NULL, and messages.sender_id is a profile id), so the
-- platform needs a profile of its own to appear as the sender. Doing it this way
-- means the whole existing messaging path is reused unchanged: the member's
-- inbox, the thread view, unread counts, and the admin moderation view that
-- already reads conversations all work with no modification.
--
-- The alternative — a nullable sender plus a "from admin" flag — would have
-- touched the message schema and every read path that assumes a sender profile.
--
-- This profile must never appear as a match. It is hidden four ways:
--   discoverable = false  — /api/search filters on this, so it cannot surface in
--                           search or the match feed
--   visibility = 'private'— the three-level gate used by the public pages
--   is_demo = true        — the public showcase filters this out
--   no public_showcase row— it is never curated onto the homepage
-- The member inbox deliberately does not filter on any of these when resolving
-- the other party, which is why the profile still renders correctly there.
--
-- The account is unloginable in practice: no password hash is set, so password
-- login fails, and '0000000000' cannot receive an OTP and is not a valid Indian
-- mobile number, so OTP login cannot be completed either. Its role is left as
-- 'user' on purpose — giving the system identity admin rights would turn a
-- messaging convenience into a privilege-escalation target.

BEGIN;

-- Reserved sentinel. Not a dialable Indian number (those begin 6-9), so it can
-- never collide with a real registration.
INSERT INTO accounts (mobile, account_status)
VALUES ('0000000000', 'active')
ON CONFLICT (mobile) DO NOTHING;

INSERT INTO profiles (
  account_id, profile_for, first_name, last_name, gender, dob, religion,
  visibility, discoverable, is_demo, profile_status, profile_complete
)
SELECT
  a.id,
  'other',
  'Mithila Jodi',
  NULL,
  -- gender and dob are NOT NULL on profiles but are meaningless for the
  -- platform's own identity. Nothing reads them: the inbox selects only id,
  -- first_name and last_name, and the profile is excluded from every
  -- gender-filtered or age-filtered query by discoverable = false.
  'male',
  '2026-01-01',
  'hindu',
  'private',
  false,
  true,
  'active',
  0
FROM accounts a
WHERE a.mobile = '0000000000'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.account_id = a.id);

COMMIT;
