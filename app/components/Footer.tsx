export default function Footer() {
  return (
      <div style={{ width: '100%', height: '100%', paddingTop: 80, paddingBottom: 48, paddingLeft: 120, paddingRight: 120, background: '#FAF9F6', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 48, display: 'inline-flex' }}>
          <div style={{ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start', display: 'inline-flex' }}>
              <div style={{ width: 320, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'inline-flex' }}>
                  <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'inline-flex' }}>
                      <div style={{ width: 24, height: 24, background: '#2563EB', borderRadius: 4, justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                          <div style={{ width: 14, height: 14, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: 11.67, height: 7, left: 1.17, top: 3.50, position: 'absolute', outline: '2px white solid', outlineOffset: '-1px' }} />
                          </div>
                      </div>
                      <div style={{ color: '#1C1917', fontSize: 18, fontFamily: 'Schibsted Grotesk', fontWeight: '800', wordWrap: 'break-word' }}>Staark Inc.</div>
                  </div>
                  <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '400', lineHeight: 21, wordWrap: 'break-word' }}>Vi skapar rena och snabba webbplatser för lokala företag i Jönköping och Värnamo, med modern teknik där det verkligen gör skillnad.</div>
              </div>
              <div style={{ justifyContent: 'flex-start', alignItems: 'flex-start', gap: 64, display: 'flex' }}>
                  <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'inline-flex' }}>
                      <div style={{ color: '#1C1917', fontSize: 13, fontFamily: 'Geist', fontWeight: '700', wordWrap: 'break-word' }}>Tjänster</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Anpassad Design</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>SEO-optimering</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Responsiv Webbplats</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Dedikerat Support</div>
                  </div>
                  <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'inline-flex' }}>
                      <div style={{ color: '#1C1917', fontSize: 13, fontFamily: 'Geist', fontWeight: '700', wordWrap: 'break-word' }}>Team</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Om oss</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Kontakta oss</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Vanliga frågor</div>
                  </div>
                  <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'inline-flex' }}>
                      <div style={{ color: '#1C1917', fontSize: 13, fontFamily: 'Geist', fontWeight: '700', wordWrap: 'break-word' }}>Sociala medier</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Facebook</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Instagram</div>
                      <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>LinkedIn</div>
                  </div>
              </div>
          </div>
          <div style={{ alignSelf: 'stretch', height: 0, border: '1px #E7E5E4 solid' }}></div>
          <div style={{ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
              <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>© 2026 Staark Inc. Alla rättigheter förbehållna.</div>
              <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                  <div style={{ color: '#6B6661', fontSize: 12, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Byggt med:</div>
                  <div style={{ color: '#1C1917', fontSize: 12, fontFamily: 'Geist', fontWeight: '600', wordWrap: 'break-word' }}>React • Next.js • Tailwind</div>
              </div>
          </div>
      </div>
  );
}