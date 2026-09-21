/** Sender rules shared by Gmail import and the legacy Inbox view. */
export function isAutomatedSender(email: string, blocked = "") {
  const address = email.trim().toLowerCase();
  const localPart = address.split("@")[0] ?? "";

  if (/(?:^|[._-])(?:no[._-]?reply|do[._-]?not[._-]?reply|mailer-daemon)(?:$|[._+-])/.test(localPart)) {
    return true;
  }

  return blocked
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) =>
      entry.startsWith("@")
        ? address.endsWith(entry)
        : address === entry
    );
}
