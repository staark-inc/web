import React from 'react';
import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';
import staarkLogo from '../public/staark-logo.png';
import { X, Menu, Mail } from 'lucide-react';

export default function Navigation({ scrolled, isLight, t, setThemeMode, lang, setLang }: { scrolled: boolean; isLight: boolean; t: any; setThemeMode: React.Dispatch<React.SetStateAction<'dark' | 'light'>>; lang: 'EN' | 'SV'; setLang: React.Dispatch<React.SetStateAction<'EN' | 'SV'>>; }) {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const toggleMobileMenu = () => setMobileMenuOpen(open => !open);
    const [quoteModalOpen, setQuoteModalOpen] = React.useState(false);
    const toggleQuoteModal = () => setQuoteModalOpen(open => !open);
    const handleMobileMenuToggle = () => toggleMobileMenu();
    const handleQuoteModalToggle = () => toggleQuoteModal();
    React.useEffect(() => {
      if (!mobileMenuOpen) return;
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, [mobileMenuOpen]);
    
    React.useEffect(() => {
      if (!quoteModalOpen) return;
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setQuoteModalOpen(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, [quoteModalOpen]);

    return (<>
      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? (isLight ? 'bg-white/90 backdrop-blur-2xl border-b border-slate-200 shadow-lg' : 'bg-[#0A0A0C]/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/80') : (isLight ? 'bg-transparent border-b border-slate-200/60' : 'bg-transparent border-b border-white/5')}`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">

          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="h-10 flex items-center justify-center">
              <Image
               src={staarkLogo} alt="Staark Inc Logo Mark" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className={`font-extrabold text-xl tracking-tight flex items-center gap-1 leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Staark <span className="text-blue-600">Inc.</span>
              </span>
              <span className={`text-[10px] font-mono tracking-widest uppercase mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Web &amp; Hosting Studio
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center gap-8 text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {[
              { label: t.navHosting, href: '#hosting' },
              { label: t.navCalc, href: '#calculator' },
              { label: t.navServices, href: '#services' },
              { label: t.navWork, href: '#work' },
              { label: t.navWhy, href: '#about' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className={`transition-colors relative group py-1 ${isLight ? 'hover:text-blue-600' : 'hover:text-white'}`}
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Theme Toggle & Language Switcher & CTA Header Action */}
          <div className="flex items-center gap-3">

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setThemeMode(mode => mode === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-[#121216] border-white/10 text-amber-300 hover:bg-white/10'
              }`}
              title="Toggle Light / Dark Theme"
            >
              {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* EN / SV Language Switcher */}
            <div className={`flex items-center border rounded-xl p-1 text-xs font-mono ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#121216] border-white/10'}`}>
              <button
                onClick={() => setLang('EN')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'EN' ? 'bg-blue-600 text-white font-bold' : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                }`}
              >
                EN 🇬🇧
              </button>
              <button
                onClick={() => setLang('SV')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'SV' ? 'bg-blue-600 text-white font-bold' : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                }`}
              >
                SV 🇸🇪
              </button>
            </div>

            <button
              onClick={() => setQuoteModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              {t.getQuoteBtn}
            </button>

            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className={`md:hidden p-2.5 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-slate-300'}`}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-b px-6 py-6 space-y-4 ${isLight ? 'bg-white/98 border-slate-200' : 'bg-[#0A0A0C]/98 backdrop-blur-2xl border-white/10'}`}>
            {[
              { label: t.navHosting, href: '#hosting' },
              { label: t.navCalc, href: '#calculator' },
              { label: t.navServices, href: '#services' },
              { label: t.navWork, href: '#work' },
              { label: t.navWhy, href: '#about' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-base font-semibold py-2 ${isLight ? 'text-slate-800 hover:text-blue-600' : 'text-slate-200 hover:text-blue-400'}`}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setQuoteModalOpen(true);
              }}
              className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-blue-600 to-blue-500 text-white text-center shadow-lg shadow-blue-500/25"
            >
              {t.getQuoteBtn}
            </button>
          </div>
        )}
      </header>
  </>);
}