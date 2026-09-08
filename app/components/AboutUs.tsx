export default function AboutUs() {
    return (
        <div style={{ width: '100%', height: '100%', padding: 120, background: 'white', borderTop: '1px #E7E5E4 solid', borderBottom: '1px #E7E5E4 solid', justifyContent: 'flex-start', alignItems: 'center', gap: 80, display: 'inline-flex' }}>
            <img style={{ width: 480, height: 480, borderRadius: 12, border: '1px #E7E5E4 solid' }} src="https://placehold.co/480x480" />
            <div style={{ flex: '1 1 0', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 32, display: 'inline-flex' }}>
                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'flex' }}>
                    <div style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: '#F5F4F0', borderRadius: 100, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex' }}>
                        <div style={{ color: '#1C1917', fontSize: 12, fontFamily: 'Geist', fontWeight: '600', textTransform: 'uppercase', wordWrap: 'break-word' }}>Om oss</div>
                    </div>
                    <div style={{ alignSelf: 'stretch', color: '#1C1917', fontSize: 40, fontFamily: 'Schibsted Grotesk', fontWeight: '700', lineHeight: 48, wordWrap: 'break-word' }}>Vår mission: Digitalisera lokala företag i Jönköping och Värnamo</div>
                </div>
                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'flex' }}>
                    <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 16, fontFamily: 'Geist', fontWeight: '400', lineHeight: 25.60, wordWrap: 'break-word' }}>Vi är ett dedikerat team av utvecklare och designers som brinner för att hjälpa småföretagare ta steget online. Vi vet att en lokal bageri, en snickeriverkstad, en tandläkarmottagning eller en familjepensionat inte behöver enorma budgetar eller komplicerade webbstrukturer för att lyckas.</div>
                    <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 16, fontFamily: 'Geist', fontWeight: '400', lineHeight: 25.60, wordWrap: 'break-word' }}>Staark Inc. är skapad för att möta just den här behoven: att erbjuda rena, snabba och ekonomiskt tillgängliga lösningar, med samma tekniska krav som stora SaaS-företag.</div>
                </div>
                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                    <div style={{ color: '#6B6661', fontSize: 12, fontFamily: 'Geist', fontWeight: '700', textTransform: 'uppercase', wordWrap: 'break-word' }}>Moderna tekniker vi använder</div>
                    <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'inline-flex' }}>
                        <div style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: '#F5F4F0', borderRadius: 6, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                            <div style={{ color: '#1C1917', fontSize: 13, fontFamily: 'Geist', fontWeight: '600', wordWrap: 'break-word' }}>Next.js</div>
                        </div>
                        <div style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: '#F5F4F0', borderRadius: 6, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                            <div style={{ color: '#1C1917', fontSize: 13, fontFamily: 'Geist', fontWeight: '600', wordWrap: 'break-word' }}>React</div>
                        </div>
                        <div style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: '#F5F4F0', borderRadius: 6, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                            <div style={{ color: '#1C1917', fontSize: 13, fontFamily: 'Geist', fontWeight: '600', wordWrap: 'break-word' }}>Tailwind CSS</div>
                        </div>
                        <div style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: '#F5F4F0', borderRadius: 6, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                            <div style={{ color: '#1C1917', fontSize: 13, fontFamily: 'Geist', fontWeight: '600', wordWrap: 'break-word' }}>Vercel</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}