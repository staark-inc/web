-- Settings v2: sender reply-to support and editable system email templates.
ALTER TABLE "Settings"
ADD COLUMN "replyToEmail" TEXT,
ADD COLUMN "emailTemplates" JSONB;
