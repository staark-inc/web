// Cloudflare's documented email_off comments must surround the entire anchor,
// including href. JSX cannot emit literal comments, so only this fixed, trusted
// markup is serialized. Never interpolate user-controlled content here.
export default function ContactEmailLink({ iconSize }: { iconSize?: 15 | 20 }) {
  const size = iconSize === 15 ? 15 : 20;
  const icon = iconSize
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`
    : "";
  return (
    <span
      style={{ display: "contents" }}
      dangerouslySetInnerHTML={{
        __html: `<!--email_off--><a href="mailto:contact@staarkinc.com">${icon}<span>contact@staarkinc.com</span></a><!--/email_off-->`,
      }}
    />
  );
}
