import dns from "node:dns/promises";

type HealthItem = {
  ok: boolean;
  detail: string;
};

export type EmailDomainHealth = {
  domain: string;
  selector: string;
  spf: HealthItem;
  dkim: HealthItem;
  dmarc: HealthItem;
};

async function resolveTxtSafe(name: string) {
  try {
    const records = await dns.resolveTxt(name);
    return records.map((parts) => parts.join(""));
  } catch {
    return [];
  }
}

function getDomain(email: string) {
  const at = email.lastIndexOf("@");
  return at === -1 ? "staarkinc.com" : email.slice(at + 1).toLowerCase();
}

function getDmarcPolicy(record: string) {
  const match = record.match(/(?:^|;)\s*p=([^;]+)/i);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

export async function getEmailDomainHealth(
  senderEmail: string
): Promise<EmailDomainHealth> {
  const domain = getDomain(senderEmail);
  const selector = process.env.GOOGLE_DKIM_SELECTOR?.trim() || "google";

  const [rootTxt, dmarcTxt, dkimTxt] = await Promise.all([
    resolveTxtSafe(domain),
    resolveTxtSafe(`_dmarc.${domain}`),
    resolveTxtSafe(`${selector}._domainkey.${domain}`),
  ]);

  const spfRecord = rootTxt.find((record) =>
    record.toLowerCase().startsWith("v=spf1")
  );
  const dmarcRecord = dmarcTxt.find((record) =>
    record.toLowerCase().startsWith("v=dmarc1")
  );
  const dkimRecord = dkimTxt.find((record) => {
    const normalized = record.toLowerCase();
    return normalized.includes("v=dkim1") || normalized.includes("p=");
  });
  const dmarcPolicy = dmarcRecord ? getDmarcPolicy(dmarcRecord) : null;

  return {
    domain,
    selector,
    spf: {
      ok: Boolean(spfRecord),
      detail: spfRecord
        ? spfRecord.includes("_spf.google.com")
          ? "Google Workspace is included in SPF."
          : "SPF record found."
        : "No SPF record found.",
    },
    dkim: {
      ok: Boolean(dkimRecord),
      detail: dkimRecord
        ? `DKIM selector “${selector}” is published.`
        : `No DKIM record found for selector “${selector}”.`,
    },
    dmarc: {
      ok: Boolean(dmarcRecord),
      detail: dmarcRecord
        ? `DMARC policy: ${dmarcPolicy ?? "configured"}.`
        : "No DMARC record found.",
    },
  };
}
