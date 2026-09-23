ALTER TABLE "User"
ADD COLUMN "notificationPreferences" JSONB;

CREATE OR REPLACE FUNCTION "create_lead_notification"()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "Notification" (
    "id",
    "userId",
    "type",
    "title",
    "message",
    "href",
    "metadata",
    "dedupeKey",
    "createdAt"
  )
  SELECT
    'notif_' || md5(random()::text || clock_timestamp()::text || NEW."id" || u."id"),
    u."id",
    'lead.created',
    'New lead',
    COALESCE(c."name", c."email") ||
      CASE
        WHEN c."company" IS NOT NULL AND c."company" <> ''
          THEN ' · ' || c."company"
        ELSE ''
      END,
    '/hub/leads/' || NEW."id",
    jsonb_build_object(
      'leadId', NEW."id",
      'contactId', NEW."contactId"
    ),
    'lead:' || NEW."id",
    NOW()
  FROM "User" u
  LEFT JOIN "Contact" c ON c."id" = NEW."contactId"
  WHERE u."role" = 'ADMIN'
    AND COALESCE(
      (u."notificationPreferences" ->> 'leads')::boolean,
      TRUE
    )
  ON CONFLICT ("userId", "dedupeKey") DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Lead_create_notification"
AFTER INSERT ON "Lead"
FOR EACH ROW
EXECUTE FUNCTION "create_lead_notification"();

CREATE OR REPLACE FUNCTION "create_inbound_message_notification"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."direction" <> 'INBOUND' THEN
    RETURN NEW;
  END IF;

  INSERT INTO "Notification" (
    "id",
    "userId",
    "type",
    "title",
    "message",
    "href",
    "metadata",
    "dedupeKey",
    "createdAt"
  )
  SELECT
    'notif_' || md5(random()::text || clock_timestamp()::text || NEW."id" || u."id"),
    u."id",
    'inbox.message_received',
    'New message',
    COALESCE(NULLIF(NEW."fromName", ''), NEW."fromEmail") || ' · ' || NEW."subject",
    '/hub/message/' || NEW."id",
    jsonb_build_object(
      'messageId', NEW."id",
      'threadId', NEW."threadId",
      'contactId', NEW."contactId"
    ),
    'message:' || NEW."id",
    NOW()
  FROM "User" u
  WHERE u."role" = 'ADMIN'
    AND COALESCE(
      (u."notificationPreferences" ->> 'inbox')::boolean,
      TRUE
    )
  ON CONFLICT ("userId", "dedupeKey") DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Message_create_notification"
AFTER INSERT ON "Message"
FOR EACH ROW
EXECUTE FUNCTION "create_inbound_message_notification"();
