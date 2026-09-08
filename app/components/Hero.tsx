export default function Hero() {
    return (
        <div style={{ width: '100%', height: '100%', paddingLeft: 120, paddingRight: 120, paddingTop: 96, paddingBottom: 96, background: '#FAF9F6', justifyContent: 'flex-start', alignItems: 'center', gap: 64, display: 'inline-flex' }}>
            <div style={{ flex: '1 1 0', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 32, display: 'inline-flex' }}>
                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'flex' }}>
                    <div style={{ alignSelf: 'stretch', color: '#1C1917', fontSize: 56, fontFamily: 'Schibsted Grotesk', fontWeight: '800', lineHeight: 64.40, wordWrap: 'break-word' }}>Ditt företag förtjänar en online-närvaro</div>
                    <div style={{ alignSelf: 'stretch', color: '#6B6661', fontSize: 18, fontFamily: 'Geist', fontWeight: '400', lineHeight: 28.80, wordWrap: 'break-word' }}>Vi skapar moderna, snabba och Google-optimerade webbplatser för småföretag i Jönköping och Värnamo. Inga dolda kostnader, rakt på sak och anpassat till din budget.</div>
                </div>
                <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'inline-flex' }}>
                    <div style={{ paddingLeft: 28, paddingRight: 28, paddingTop: 14, paddingBottom: 14, background: '#2563EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <div style={{ color: 'white', fontSize: 15, fontFamily: 'Geist', fontWeight: '600', wordWrap: 'break-word' }}>Begär offert</div>
                    </div>
                    <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                        <div style={{ width: 20, height: 20, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: 16.67, height: 16.67, left: 1.67, top: 1.67, position: 'absolute', outline: '2px #1C1917 solid', outlineOffset: '-1px' }} />
                        </div>
                        <div style={{ color: '#1C1917', fontSize: 14, fontFamily: 'Geist', fontWeight: '600', wordWrap: 'break-word' }}>+46 72 200 00 00</div>
                    </div>
                </div>
                <div style={{ paddingTop: 16, justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'inline-flex' }}>
                    <div style={{ justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                        <div style={{ width: 32, height: 32, overflow: 'hidden', borderRadius: 16, outline: '2px #FAF9F6 solid', outlineOffset: '-2px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                            <img style={{ flex: '1 1 0', alignSelf: 'stretch' }} src="https://placehold.co/32x32" />
                        </div>
                        <div style={{ width: 32, height: 32, overflow: 'hidden', borderRadius: 16, outline: '2px #FAF9F6 solid', outlineOffset: '-2px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                            <img style={{ flex: '1 1 0', alignSelf: 'stretch' }} src="https://placehold.co/32x32" />
                        </div>
                        <div style={{ width: 32, height: 32, overflow: 'hidden', borderRadius: 16, outline: '2px #FAF9F6 solid', outlineOffset: '-2px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                            <img style={{ flex: '1 1 0', alignSelf: 'stretch' }} src="https://placehold.co/32x32" />
                        </div>
                    </div>
                    <div style={{ color: '#6B6661', fontSize: 13, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>Vi stödjer bagerier, mottagningar, verkstäder och lokala entreprenörer.</div>
                </div>
            </div>
            <div style={{ width: 536, height: 380, background: 'white', boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.03)', overflow: 'hidden', borderRadius: 12, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex' }}>
                <div style={{ alignSelf: 'stretch', paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, background: '#F5F4F0', borderBottom: '1px #E7E5E4 solid', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                    <div style={{ justifyContent: 'flex-start', alignItems: 'flex-start', gap: 6, display: 'flex' }}>
                        <div style={{ width: 8, height: 8, background: '#EF4444', borderRadius: 9999 }} />
                        <div style={{ width: 8, height: 8, background: '#F59E0B', borderRadius: 9999 }} />
                        <div style={{ width: 8, height: 8, background: '#10B981', borderRadius: 9999 }} />
                    </div>
                    <div style={{ width: 280, paddingLeft: 32, paddingRight: 32, paddingTop: 4, paddingBottom: 4, background: 'white', borderRadius: 4, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                        <div style={{ flex: '1 1 0', textAlign: 'center', color: '#6B6661', fontSize: 11, fontFamily: 'Geist', fontWeight: '400', wordWrap: 'break-word' }}>brodbracka.se</div>
                    </div>
                    <div style={{ width: 14, height: 14, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ width: 10.50, height: 10.50, left: 1.75, top: 1.75, position: 'absolute', outline: '2px #6B6661 solid', outlineOffset: '-1px' }} />
                    </div>
                </div>
                <div style={{ alignSelf: 'stretch', flex: '1 1 0', padding: 24, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                    <div style={{ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                        <div style={{ color: '#1C1917', fontSize: 14, fontFamily: 'Schibsted Grotesk', fontWeight: '700', wordWrap: 'break-word' }}>Bageri Bröd &amp; Bröd</div>
                        <div style={{ justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                            <div style={{ width: 40, height: 6, background: '#E7E5E4', borderRadius: 3 }} />
                            <div style={{ width: 40, height: 6, background: '#E7E5E4', borderRadius: 3 }} />
                        </div>
                    </div>
                    <div style={{ alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'inline-flex' }}>
                        <div style={{ flex: '1 1 0', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'inline-flex' }}>
                            <div style={{ alignSelf: 'stretch', color: '#1C1917', fontSize: 22, fontFamily: 'Schibsted Grotesk', fontWeight: '700', lineHeight: 26.40, wordWrap: 'break-word' }}>Hantverksbröd med surdeg, bakat dagligen i stenugn</div>
                            <div style={{ width: 120, height: 24, background: '#2563EB', borderRadius: 4 }} />
                        </div>
                        <img style={{ width: 180, height: 180, borderRadius: 8 }} src="https://placehold.co/180x180" />
                    </div>
                </div>
            </div>
        </div>
    )
}