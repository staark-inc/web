export default function Navigation() {
    return (
        <div style={{ width: '100%', height: '100%', paddingLeft: 120, paddingRight: 120, background: '#FAF9F6', borderBottom: '1px #E7E5E4 solid', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
            <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                <div style={{ width: 32, height: 32, background: '#2563EB', borderRadius: 6, justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                    <div style={{ width: 18, height: 18, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ width: 15, height: 9, left: 1.50, top: 4.50, position: 'absolute', outline: '2px white solid', outlineOffset: '-1px' }} />
                    </div>
                </div>
                <div style={{ color: '#1C1917', fontSize: 20, fontFamily: 'Schibsted Grotesk', fontWeight: '800', wordWrap: 'break-word' }}>Staark Inc</div>
            </div>
            <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 32, display: 'flex' }}>
                <div style={{ color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '500', wordWrap: 'break-word' }}>Tjänster</div>
                <div style={{ color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '500', wordWrap: 'break-word' }}>Hur det fungerar</div>
                <div style={{ color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '500', wordWrap: 'break-word' }}>Om oss</div>
                <div style={{ color: '#6B6661', fontSize: 14, fontFamily: 'Geist', fontWeight: '500', wordWrap: 'break-word' }}>Priser</div>
            </div>
            <div style={{ paddingLeft: 28, paddingRight: 28, paddingTop: 14, paddingBottom: 14, background: 'white', borderRadius: 8, outline: '1px #E7E5E4 solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <div style={{ color: '#1C1917', fontSize: 15, fontFamily: 'Geist', fontWeight: '600', wordWrap: 'break-word' }}>Kontakta oss</div>
            </div>
        </div>
    )
}