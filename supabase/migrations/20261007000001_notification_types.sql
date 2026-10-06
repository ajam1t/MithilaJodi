-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20261007000001 — notification types for the member notification
-- centre. Separate from 20261007000002 because Postgres will not let a new
-- enum value be used in the same transaction that adds it. Additive only.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'mutual_match';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_member_match';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_member_city';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'unread_message_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'profile_incomplete';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'announcement';
