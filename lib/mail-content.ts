export type SplitMailContent = {
  visible: string;
  quoted: string;
};

const QUOTE_PATTERNS: RegExp[] = [
  /(?:^|\n)On [\s\S]{1,500}? wrote:\s*/i,
  /(?:^|\n)În [\s\S]{1,500}?\s+a\s+scris:\s*/i,
  /(?:^|\n)Den [\s\S]{1,500}? skrev(?: [\s\S]{1,120}?)?:\s*/i,
  /(?:^|\n)Am [\s\S]{1,500}? schrieb(?: [\s\S]{1,120}?)?:\s*/i,
  /(?:^|\n)Le [\s\S]{1,500}? a écrit\s*:\s*/i,
  /(?:^|\n)-{2,}\s*Original Message\s*-{2,}\s*/i,
  /(?:^|\n)From:\s.+\n(?:Sent|Date):\s/i,
  /(?:^|\n)>/m,
];

export function normalizeMailBody(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

function findQuotedStart(value: string) {
  let earliest = -1;

  for (const pattern of QUOTE_PATTERNS) {
    const match = pattern.exec(value);
    if (!match) continue;

    const index = match.index + (match[0].startsWith("\n") ? 1 : 0);
    if (earliest === -1 || index < earliest) {
      earliest = index;
    }
  }

  return earliest;
}

export function splitQuotedMail(value: string): SplitMailContent {
  const normalized = normalizeMailBody(value).trim();
  if (!normalized) {
    return { visible: "", quoted: "" };
  }

  const quoteStart = findQuotedStart(normalized);

  if (quoteStart <= 0) {
    return { visible: normalized, quoted: "" };
  }

  return {
    visible: normalized.slice(0, quoteStart).trim(),
    quoted: normalized.slice(quoteStart).trim(),
  };
}

export function sanitizeMailText(value: string) {
  return value
    .replace(/<([^<>\s]+@[^<>\s]+)>/g, "$1")
    .replace(/[<>]/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

export function getVisibleMailBody(value: string) {
  return splitQuotedMail(value).visible;
}

export function createMailPreview(value: string, maxLength = 150) {
  const { visible } = splitQuotedMail(value);
  const normalized = sanitizeMailText(visible || value)
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}
