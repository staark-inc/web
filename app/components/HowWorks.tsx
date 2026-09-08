export default function HowWorks() {
    return (
        <div style={{ width: '100%', height: '100%', padding: 120, background: '#FAF9F6', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 64, display: 'inline-flex' }}>
            <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'flex' }}>
                <div style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: '#F5F4F0', borderRadius: 100, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex' }}>
                    <div style={{ color: '#1C1917', fontSize: 12, fontFamily: 'Geist', fontWeight: '600', textTransform: 'uppercase', wordWrap: 'break-word' }}>Vår process</div>
                </div>
                <div style={{ alignSelf: 'stretch', textAlign: 'center', color: '#1C1917', fontSize: 40, fontFamily: 'Schibsted Grotesk', fontWeight: '700', lineHeight: 48, wordWrap: 'break-word' }}>Från idé till färdig webbplats på bara tre enkla steg</div>
                <div style={{ width: 640, textAlign: 'center', color: '#6B6661', fontSize: 16, fontFamily: 'Geist', fontWeight: '400', lineHeight: 25.60, wordWrap: 'break-word' }}>Vi har förenklat hela utvecklingsprocessen för att spara din tid. Du bidrar med berättelsen, vi bidrar med den digitala närvaron.</div>
            </div>
            <div style={{ alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 32, display: 'inline-flex' }}>
                <div style={{ flex: '1 1 0', padding: 32, background: 'white', borderRadius: 12, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'inline-flex' }}>
                    <div style={{ opacity: 0.30, color: '#2563EB', fontSize: 40, fontFamily: 'Geist', fontWeight: '800', wordWrap: 'break-word' }}>01</div>
                    <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                        <div style={{ alignSelf: 'stretch', color: '#1C1917', fontSize: 20, fontFamily: 'Schibsted Grotesk', fontWeight: '700', wordWrap: 'break-word' }}>Kontakta oss</div>
                        <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '400', lineHeight: 21, wordWrap: 'break-word' }}>Fyll i formuläret på webben eller ring oss direkt. Berätta kort om din verksamhet.</div>
                    </div>
                </div>
                <div style={{ flex: '1 1 0', padding: 32, background: 'white', borderRadius: 12, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'inline-flex' }}>
                    <div style={{ opacity: 0.30, color: '#2563EB', fontSize: 40, fontFamily: 'Geist', fontWeight: '800', wordWrap: 'break-word' }}>02</div>
                    <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                        <div style={{ alignSelf: 'stretch', color: '#1C1917', fontSize: 20, fontFamily: 'Schibsted Grotesk', fontWeight: '700', wordWrap: 'break-word' }}>Vi diskuterar dina behov</div>
                        <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '400', lineHeight: 21, wordWrap: 'break-word' }}>Vi bestämmer tillsammans vilka sidor som behövs, texter, kontaktuppgifter och relevanta bilder för ditt företag.</div>
                    </div>
                </div>
                <div style={{ flex: '1 1 0', padding: 32, background: 'white', borderRadius: 12, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'inline-flex' }}>
                    <div style={{ opacity: 0.30, color: '#2563EB', fontSize: 40, fontFamily: 'Geist', fontWeight: '800', wordWrap: 'break-word' }}>03</div>
                    <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                        <div style={{ alignSelf: 'stretch', color: '#1C1917', fontSize: 20, fontFamily: 'Schibsted Grotesk', fontWeight: '700', wordWrap: 'break-word' }}>Du får din färdiga webbplats</div>
                        <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '400', lineHeight: 21, wordWrap: 'break-word' }}>Vi skriver koden, optimerar plattformen och sätter den live. Du är redo att ta emot dina första kunder online.</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function HowWorksStep({ step, title, description }: { step: string; title: string; description: string }) {
    return (
        <div style={{ width: '100%', height: '100%', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 32, display: 'inline-flex' }}>
            <div style={{ flex: '1 1 0', padding: 32, background: 'white', borderRadius: 12, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'inline-flex' }}>
                <div style={{ opacity: 0.30, color: '#2563EB', fontSize: 40, fontFamily: 'Geist', fontWeight: '800', wordWrap: 'break-word' }}>01</div>
                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                    <div style={{ alignSelf: 'stretch', color: '#1C1917', fontSize: 20, fontFamily: 'Schibsted Grotesk', fontWeight: '700', wordWrap: 'break-word' }}>Kontakta oss</div>
                    <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '400', lineHeight: 21, wordWrap: 'break-word' }}>Fyll i formuläret på webben eller ring oss direkt. Berätta kort om din verksamhet.</div>
                </div>
            </div>

            <div style={{ flex: '1 1 0', padding: 32, background: 'white', borderRadius: 12, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'inline-flex' }}>
                <div style={{ opacity: 0.30, color: '#2563EB', fontSize: 40, fontFamily: 'Geist', fontWeight: '800', wordWrap: 'break-word' }}>02</div>
                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                    <div style={{ alignSelf: 'stretch', color: '#1C1917', fontSize: 20, fontFamily: 'Schibsted Grotesk', fontWeight: '700', wordWrap: 'break-word' }}>Vi diskuterar dina behov</div>
                    <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '400', lineHeight: 21, wordWrap: 'break-word' }}>Vi bestämmer tillsammans vilka sidor som behövs, texter, kontaktuppgifter och relevanta bilder för ditt företag.</div>
                </div>
            </div>
            
            <div style={{ flex: '1 1 0', padding: 32, background: 'white', borderRadius: 12, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'inline-flex' }}>
                <div style={{ opacity: 0.30, color: '#2563EB', fontSize: 40, fontFamily: 'Geist', fontWeight: '800', wordWrap: 'break-word' }}>03</div>
                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                    <div style={{ alignSelf: 'stretch', color: '#1C1917', fontSize: 20, fontFamily: 'Schibsted Grotesk', fontWeight: '700', wordWrap: 'break-word' }}>Du får din färdiga webbplats</div>
                    <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '400', lineHeight: 21, wordWrap: 'break-word' }}>Vi skriver koden, optimerar plattformen och sätter den live. Du är redo att ta emot dina första kunder online.</div>
                </div>
            </div>
        </div>
    )
}