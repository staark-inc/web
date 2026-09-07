'use client';

import React, { useState, useEffect } from 'react';
import staarkLogo from '@/public/logo.png';
import Image from 'next/image';
import {
  Code2, Zap, ShieldCheck, ArrowRight,
  CheckCircle2, Terminal as TerminalIcon, Cpu, Layers,
  ExternalLink, ChevronRight, RotateCcw, Gauge, Star,
  Menu, X, Sparkles, TrendingUp, Monitor, ShoppingBag,
  Sparkle, Check, Send, PhoneCall, Play, Clock,
  Award, Users, MessageSquare, ArrowUpRight, Globe, Lock,
  Layout, BarChart3, Smartphone, Laptop, Mail, HardDrive, Database, Server, Key, Sun, Moon
} from 'lucide-react';

// Tech stack logo/badge list
const MARQUEE_TECH = [
  { name: 'Next.js 15', role: 'Full-Stack Framework', tag: 'App Router' },
  { name: 'PHP 8.3 & MySQL', role: 'Hosting Engine', tag: 'Panel & FTP' },
  { name: '10GB NVMe Storage', role: 'Fast Web Storage', tag: 'SSD Powered' },
  { name: 'React 19', role: 'UI Library', tag: 'Server Components' },
  { name: 'TypeScript', role: 'Language', tag: 'Type-Safe' },
  { name: 'Tailwind CSS v4', role: 'Design Tokens', tag: 'Utility First' },
  { name: 'Shopify Storefront API', role: 'Headless E-Com', tag: 'GraphQL' },
  { name: 'Vercel Edge', role: 'Global Hosting', tag: 'Sub-20ms TTFB' },
];

// Content Dictionary for Dual Language (EN / SV)
const CONTENT = {
  EN: {
    badge: 'MODERN WEB & HOSTING STUDIO',
    badgeSub: 'Sweden & Global Hosting Solutions',
    headlineMain: 'Bespoke Web Design &',
    headlineSub: 'Fast Web Hosting Services',
    heroDesc: 'Staark Inc. builds modern websites and provides reliable web hosting, 10GB NVMe storage, MySQL databases, web panel access, FTP, and PHP support for companies in Sweden.',
    getQuoteBtn: 'Request Price & Offer',
    exploreWorkBtn: 'View Hosting & Web Services',
    metric1: '10GB NVMe Web Storage',
    metric2: 'MySQL Database & FTP',
    metric3: 'Panel Access Included',
    metric4: 'PHP 8.3 Ready',
    
    // Hosting Section
    hostingTitle: 'Web Storage & Hosting',
    hostingSubtitle: 'Fast, simple hosting packages for business websites.',
    h1Title: '10GB SSD',
    h1Desc: 'High-speed NVMe space for files and media.',
    h2Title: 'MySQL DB',
    h2Desc: 'Dedicated database access with web management.',
    h3Title: 'Web Panel',
    h3Desc: 'Control panel access with secure FTP credentials.',
    h4Title: 'PHP 8.3',
    h4Desc: 'Fast PHP 8.3 server with SSL security included.',

    // Services
    servicesTitle: 'Complete Web Packages',
    servicesSubtitle: 'Simple, transparent web design and hosting packages tailored for your business in Sweden.',
    s1Title: 'Custom Web Design & Build',
    s1Outcome: 'Stand out in Sweden with a fresh, modern website.',
    s1Desc: 'We design and code bespoke React 19 & Next.js websites for Swedish companies. No outdated templates—only sleek styling and clean code.',
    s1Highlights: ['Unique Custom UI Design', 'Next.js 15 Architecture', 'Mobile Responsive'],
    
    s2Title: 'E-Commerce Online Stores',
    s2Outcome: 'High-converting online shops built for sales.',
    s2Desc: 'Sleek, fast e-commerce frontends connected to Shopify or custom platforms with Klarna / Swish payment readiness.',
    s2Highlights: ['Fast Product Filtering', 'Instant Cart & Checkout', 'Multi-Currency & SEK Support'],

    s3Title: 'Web Hosting & Storage (10GB + MySQL + FTP)',
    s3Outcome: 'All-in-one hosting with Panel, PHP, and FTP access.',
    s3Desc: 'Complete web hosting setup with 10GB NVMe storage, MySQL database, full control panel access, FTP accounts, and fast PHP support.',
    s3Highlights: ['10GB NVMe Fast Storage', 'MySQL & Web Management', 'FTP & Control Panel'],

    s4Title: 'Welcome Pages & Presentations',
    s4Outcome: 'High-impact landing pages for company launches.',
    s4Desc: 'Create immediate authority for new business launches, product unveilings, or company presentations.',
    s4Highlights: ['Interactive Web Showcase', 'Sub-Second Page Load', 'Technical Schema Data'],

  // Nav
  navHosting: 'Web Hosting',
  navCalc: 'Calculator',
  navServices: 'Services',
  navWork: 'Work',
  navWhy: 'Why Us',

  // Calculator
  calcBadge: 'HOSTING & STORAGE CALCULATOR',
  calcTitle: 'Interactive Custom Plan Builder',
  calcSubtitle: 'Configure your custom web storage, database & panel requirements to calculate instant estimates in SEK / EUR.',
  calcStorageLabel: 'NVMe Web Storage',
  calcDbLabel: 'MySQL Databases',
  calcFtpLabel: 'FTP & Panel User Accounts',
  calcSslLabel: 'Automated SSL & Security',
  calcPhpLabel: 'PHP Version',
  calcSslFree: 'Free Let\'s Encrypt SSL Included',
  calcEstMonthly: 'Estimated Monthly Fee',
  calcEstYearly: 'Annual Plan (Save 20%)',
  calcOrderBtn: 'Configure & Request Quote',

    // CTA
    ctaTitle: 'Need web design or 10GB hosting?',
    ctaDesc: 'Enter your work email below. We\'ll send our hosting & web build price breakdown within 24 hours.',
    ctaBtn: 'Get Price Quote',
  },
  SV: {
    badge: 'MODERN WEBBSTUDIO & WEBBAVHOTELL',
    badgeSub: 'Webbhotell & Domän i Sverige',
    headlineMain: 'Skräddarsydd Webbalag &',
    headlineSub: 'Snabbt Webbhotell med 10GB',
    heroDesc: 'Staark Inc. skapar moderna webbplatser och erbjuder pålitligt webbhotell med 10GB NVMe-utrymme, MySQL-databas, panel, FTP och PHP 8.3 för företag i Sverige.',
    getQuoteBtn: 'Begär Prisförslag & Offert',
    exploreWorkBtn: 'Visa Webbhotell & Tjänster',
    metric1: '10GB NVMe Webblagring',
    metric2: 'MySQL-databas & FTP',
    metric3: 'Ingår Panel',
    metric4: 'Klar för PHP 8.3',

    // Hosting Section
    hostingTitle: 'Webblagring & Webbhotell',
    hostingSubtitle: 'Snabba och enkla hostingpaket för företagssidor.',
    h1Title: '10GB SSD',
    h1Desc: 'NVMe SSD-utrymme för dina hemsidefiler och bilder.',
    h2Title: 'MySQL DB',
    h2Desc: 'Databas med webbhantering för dynamiska sajter.',
    h3Title: 'Webbpanel',
    h3Desc: 'Kontrollpanel med säkra FTP-uppgifter.',
    h4Title: 'PHP 8.3',
    h4Desc: 'PHP 8.3-miljö med gratis SSL-certifikat.',

    // Services
    servicesTitle: 'Kompletta Webbpaket',
    servicesSubtitle: 'Enkla och transparenta paket för webbdesign, hosting och lagring för svenska företag.',
    s1Title: 'Skräddarsydd Webbalag & Utveckling',
    s1Outcome: 'Stick ut i Sverige med en modern och unik webbplats.',
    s1Desc: 'Vi designar och kodar unika React 19 & Next.js-webbplatser för svenska företag. Inga långsamma mallar—endast stilren design och ren kod.',
    s1Highlights: ['Unik Skräddarsydd UI-Design', 'Next.js 15-Arkitektur', 'Anpassad för Mobil & Läsplatta'],

    s2Title: 'E-Handel & Webbutiker',
    s2Outcome: 'Snabba onlinebutiker byggda för ökad försäljning.',
    s2Desc: 'Snygga och blixtsnabba e-handelslösningar kopplade till Shopify eller egna system med stöd för Klarna och Swish.',
    s2Highlights: ['Snabb Produktfiltrering', 'Blixtsnabb Kassa', 'Stöd för SEK, EUR & USD'],

    s3Title: 'Webbhotell & 10GB Lagring (MySQL + FTP)',
    s3Outcome: 'Allt-i-ett-hosting med Panel, PHP och FTP-åtkomst.',
    s3Desc: 'Komplett webbhotell med 10GB NVMe-utrymme, MySQL-databas, kontrollpanel, FTP-konton och snabbt PHP-stöd.',
    s3Highlights: ['10GB NVMe Snabb Lagring', 'MySQL & Webbhantering', 'FTP & Panel'],

    s4Title: 'Presentationssidor & Landningssidor',
    s4Outcome: 'Imponerande välkomstsidor för företag och lanseringar.',
    s4Desc: 'Skapa direkt auktoritet vid företagslanseringar, produktpresentationer eller investerarpitchar.',
    s4Highlights: ['Interaktiv Webbvisning', 'Laddar Under 1 Sekund', 'Teknisk SEO-Struktur'],

  // Nav
  navHosting: 'Webbhotell',
  navCalc: 'Kalkylator',
  navServices: 'Tjänster',
  navWork: 'Webbsidor',
  navWhy: 'Varför Oss',

  // Calculator
  calcBadge: 'HOSTING & STORAGE KALKYLATOR',
  calcTitle: 'Interaktiv Planbyggare',
  calcSubtitle: 'Konfigurera dina krav på webblagring, databas och panel för att få en direkt beräkning i SEK / EUR.',
  calcStorageLabel: 'NVMe Webblagring',
  calcDbLabel: 'MySQL Databaser',
  calcFtpLabel: 'FTP & Panel Användarkonton',
  calcSslLabel: 'Automatiskt SSL & Säkerhet',
  calcPhpLabel: 'PHP-version',
  calcSslFree: 'Gratis Let\'s Encrypt SSL ingår',
  calcEstMonthly: 'Uppskattad Månadsavgift',
  calcEstYearly: 'Årsplan (Spara 20%)',
  calcOrderBtn: 'Konfigurera & Begär Offert',

    // CTA
    ctaTitle: 'Behöver du webbdesign eller 10GB webbhotell?',
    ctaDesc: 'Fyll i din e-post nedan så skickar vi en tydlig prisuppgift för webb & hosting inom 24 timmar.',
    ctaBtn: 'Få Prisförslag',
  }
};

// Showroom project concepts
const SHOWCASE_PROJECTS = [
  {
    id: 'aura',
    client: 'Aura Apparel (Sweden)',
    industry: 'E-Commerce Storefront',
    headline: 'Bespoke Storefront Concept Built for Swedish E-Commerce',
    metric: '100/100 Speed',
    tags: ['Headless E-Commerce', 'Shopify API', 'React 19'],
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&auto=format',
    url: 'aura-sweden.staark.inc',
    desc: 'Demonstration of our high-speed React 19 storefront setup. Instant page transitions, Klarna checkout readiness, and zero layout shift.',
  },
  {
    id: 'synth',
    client: 'Nordic AI Workspace',
    industry: 'Hosted Presentation App',
    headline: 'Hosted Landing Page on 10GB NVMe Server Engine',
    metric: 'Sub-200ms TTFB',
    tags: ['Panel Hosting', 'PHP 8.3 & MySQL', 'Tailwind CSS'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&auto=format',
    url: 'nordic-ai.staark.inc',
    desc: 'Real-time collaborative canvas layout hosted on secure NVMe server space with MySQL database and panel access.',
  },
  {
    id: 'vera',
    client: 'Vera Consulting Stockholm',
    industry: 'Corporate Welcome Page',
    headline: 'Modern Swedish Company Presentation Experience',
    metric: 'Zero Friction',
    tags: ['10GB Web Storage', 'FTP Access', 'PHP Support'],
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop&auto=format',
    url: 'veraconsulting.se',
    desc: 'Streamlined corporate onboarding and presentation UX engineered for instant loading on mobile devices in Sweden and Europe.',
  }
];

export default function App() {
  const [lang, setLang] = useState<'EN' | 'SV'>('EN');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const t = CONTENT[lang];

  const [activeShowcase, setActiveShowcase] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  
  const [emailInput, setEmailInput] = useState('');
  const [projectType, setProjectType] = useState('10GB Hosting + Web Storage');
  const [userNote, setUserNote] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const [interactiveAuditRun, setInteractiveAuditRun] = useState(false);

  // Calculator State
  const [calcStorageGb, setCalcStorageGb] = useState(10); // GB
  const [calcDbCount, setCalcDbCount] = useState(1);
  const [calcFtpUsers, setCalcFtpUsers] = useState(1);
  const [calcPhpVersion, setCalcPhpVersion] = useState('PHP 8.3');
  const [calcBillingCycle, setCalcBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Pricing formula
  const basePriceSek = 79; // Base for 10GB, 1 DB, 1 FTP
  const storageExtraSek = Math.max(0, calcStorageGb - 10) * 5; // 5 SEK / extra GB
  const dbExtraSek = (calcDbCount - 1) * 15; // 15 SEK / extra DB
  const ftpExtraSek = (calcFtpUsers - 1) * 10; // 10 SEK / extra FTP user
  
  const monthlyTotalSek = basePriceSek + storageExtraSek + dbExtraSek + ftpExtraSek;
  const yearlyMonthlyEquivSek = Math.round(monthlyTotalSek * 0.8);
  const displaySek = calcBillingCycle === 'yearly' ? yearlyMonthlyEquivSek : monthlyTotalSek;
  const displayEur = (displaySek / 11.2).toFixed(1);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerAuditSimulator = () => {
    setInteractiveAuditRun(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 5;
      if (current >= 100) {
        clearInterval(interval);
        setInteractiveAuditRun(false);
      }
    }, 30);
  };

  const handleQuickQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setQuoteModalOpen(false);
      setEmailInput('');
      setUserNote('');
    }, 3000);
  };

  const isLight = themeMode === 'light';

  return (
    <div className={`min-h-screen ${isLight ? 'light-theme bg-[#F8FAFC] text-slate-800 selection:bg-blue-600 selection:text-white' : 'dark-theme bg-[#0A0A0C] text-[#F3F4F6] selection:bg-blue-500 selection:text-white'} font-sans relative overflow-x-hidden transition-colors duration-300`}>

      {/* Global Ambient Glow Orbs */}
      <div className={`fixed top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] ${isLight ? 'bg-gradient-to-b from-blue-400/20 via-blue-200/10 to-transparent' : 'bg-gradient-to-b from-blue-600/15 via-blue-900/5 to-transparent'} blur-[160px] pointer-events-none rounded-full -z-10 animate-pulse-glow`} />
      <div className={`fixed top-[40%] right-[-10%] w-[600px] h-[600px] ${isLight ? 'bg-blue-400/15' : 'bg-blue-500/10'} blur-[180px] pointer-events-none rounded-full -z-10`} />

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

      {/* ─── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="space-y-8 text-center max-w-4xl mx-auto">

          {/* Hosting & Studio Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono ${isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-500/10 border-blue-500/30 text-blue-300'}`}>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className={`font-bold uppercase tracking-wider ${isLight ? 'text-blue-900' : 'text-white'}`}>{t.badge}</span>
            <span className="text-slate-400">&bull;</span>
            <span>{t.badgeSub}</span>
          </div>

          {/* Clean Display Headline */}
          <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t.headlineMain}<br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {t.headlineSub}
            </span>
          </h1>

          {/* Straightforward Value Proposition */}
          <p className={`text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-normal ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.heroDesc}
          </p>

          {/* Hero CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setQuoteModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-sm uppercase tracking-wider bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              {t.getQuoteBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#hosting"
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${isLight ? 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 shadow-sm' : 'bg-[#121216] text-slate-200 border-white/10 hover:border-white/20'}`}
            >
              <HardDrive className="w-4 h-4 text-blue-500" />
              {t.exploreWorkBtn}
            </a>
          </div>

          {/* Hosting Feature Chips */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            {[
              { val: '10GB NVMe', label: t.metric1, icon: <HardDrive className="w-4 h-4 text-blue-500" /> },
              { val: 'MySQL + FTP', label: t.metric2, icon: <Database className="w-4 h-4 text-cyan-500" /> },
              { val: 'Panel Access', label: t.metric3, icon: <Server className="w-4 h-4 text-emerald-500" /> },
              { val: 'PHP 8.3 Ready', label: t.metric4, icon: <Code2 className="w-4 h-4 text-blue-500" /> },
            ].map((m, i) => (
              <div key={i} className={`p-4 rounded-2xl border backdrop-blur-md ${isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-[#121216]/80 border-white/5'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {m.icon}
                  <span className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{m.val}</span>
                </div>
                <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{m.label}</div>
              </div>
            ))}
          </div>

        </div>

        {/* Website Showcase Mockup Frame */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-blue-600/20 to-cyan-500/15 rounded-3xl blur-2xl -z-10" />

          <div className={`rounded-2xl border shadow-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#121216] border-white/10'}`}>

            <div className={`px-4 py-3 border-b flex items-center justify-between ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0A0A0C] border-white/10'}`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <div className={`ml-3 px-3 py-1 rounded-md border text-xs font-mono flex items-center gap-2 w-64 sm:w-80 ${isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate">https://{SHOWCASE_PROJECTS[activeShowcase].url}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={triggerAuditSimulator}
                  disabled={interactiveAuditRun}
                  className="px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${interactiveAuditRun ? 'animate-spin' : ''}`} />
                  {interactiveAuditRun ? 'Testing…' : 'Test Speed'}
                </button>
              </div>
            </div>

            <div className="relative aspect-[16/9] sm:aspect-[21/9] overflow-hidden group">
              <img
                src={SHOWCASE_PROJECTS[activeShowcase].image}
                alt={SHOWCASE_PROJECTS[activeShowcase].client}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className={`absolute inset-0 flex flex-col justify-end p-6 sm:p-10 ${isLight ? 'bg-gradient-to-t from-white via-white/40 to-transparent' : 'bg-gradient-to-t from-[#121216] via-[#121216]/40 to-transparent'}`}>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/30 text-blue-600 text-xs font-mono font-bold">
                      {SHOWCASE_PROJECTS[activeShowcase].industry}
                    </span>
                    <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {SHOWCASE_PROJECTS[activeShowcase].headline}
                    </h3>
                  </div>

                  <div className={`px-5 py-3 rounded-xl backdrop-blur-md border text-right ${isLight ? 'bg-white/90 border-slate-200' : 'bg-black/80 border-white/10'}`}>
                    <div className="text-xs text-slate-500 font-mono">Performance</div>
                    <div className="text-2xl font-black text-blue-600 font-mono">
                      {SHOWCASE_PROJECTS[activeShowcase].metric}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className={`p-4 border-t flex items-center justify-between overflow-x-auto gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0A0C] border-white/10'}`}>
              <span className={`text-xs font-mono shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>PRESENT WEBSITES:</span>
              <div className="flex items-center gap-2">
                {SHOWCASE_PROJECTS.map((proj, idx) => (
                  <button
                    key={proj.id}
                    onClick={() => setActiveShowcase(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      activeShowcase === idx
                        ? 'bg-blue-600 text-white shadow-md'
                        : (isLight ? 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5')
                    }`}
                  >
                    {proj.client}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── INTERACTIVE HOSTING STORAGE CALCULATOR & PLAN BUILDER ────── */}
      <section id="calculator" className="py-24 max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className={`rounded-3xl border p-8 sm:p-12 relative overflow-hidden ${isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#121216] border-white/10 shadow-2xl'}`}>
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-mono font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              {t.calcBadge}
            </div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.calcTitle}
            </h2>
            <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {t.calcSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Controls */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Storage Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className={`flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    <HardDrive className="w-4 h-4 text-blue-500" />
                    {t.calcStorageLabel}
                  </span>
                  <span className="font-mono text-blue-600 font-extrabold text-base px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    {calcStorageGb} GB NVMe
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={calcStorageGb}
                  onChange={(e) => setCalcStorageGb(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className={`flex justify-between text-[11px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>5 GB</span>
                  <span>10 GB (Standard)</span>
                  <span>50 GB</span>
                  <span>100 GB</span>
                </div>
              </div>

              {/* MySQL DB Counter */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className={`flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    <Database className="w-4 h-4 text-cyan-500" />
                    {t.calcDbLabel}
                  </span>
                  <span className="font-mono text-cyan-600 font-extrabold text-base px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    {calcDbCount} {calcDbCount === 1 ? 'Database' : 'Databases'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setCalcDbCount(num)}
                      className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        calcDbCount === num
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
                      }`}
                    >
                      {num} DB
                    </button>
                  ))}
                </div>
              </div>

              {/* FTP & Panel Users */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className={`flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    <Key className="w-4 h-4 text-indigo-500" />
                    {t.calcFtpLabel}
                  </span>
                  <span className="font-mono text-indigo-600 font-extrabold text-base px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    {calcFtpUsers} {calcFtpUsers === 1 ? 'Account' : 'Accounts'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setCalcFtpUsers(num)}
                      className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        calcFtpUsers === num
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
                      }`}
                    >
                      {num} {num === 1 ? 'FTP Account' : 'FTP Accounts'}
                    </button>
                  ))}
                </div>
              </div>

              {/* PHP Engine */}
              <div className="space-y-3">
                <span className={`block text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Server className="w-4 h-4 text-emerald-500" />
                  {t.calcPhpLabel}
                </span>
                <div className="flex gap-2">
                  {['PHP 8.3', 'PHP 8.2', 'Node.js / Next.js'].map((ver) => (
                    <button
                      key={ver}
                      onClick={() => setCalcPhpVersion(ver)}
                      className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        calcPhpVersion === ver
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
                      }`}
                    >
                      {ver}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Summary Card */}
            <div className="lg:col-span-5">
              <div className={`p-8 rounded-3xl border space-y-6 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0A0C] border-blue-500/30 shadow-xl'}`}>
                
                {/* Cycle Switch */}
                <div className={`p-1 rounded-2xl border flex font-mono text-xs ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <button
                    onClick={() => setCalcBillingCycle('yearly')}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                      calcBillingCycle === 'yearly' ? 'bg-blue-600 text-white font-bold' : (isLight ? 'text-slate-600' : 'text-slate-400')
                    }`}
                  >
                    {t.calcEstYearly}
                  </button>
                  <button
                    onClick={() => setCalcBillingCycle('monthly')}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                      calcBillingCycle === 'monthly' ? 'bg-blue-600 text-white font-bold' : (isLight ? 'text-slate-600' : 'text-slate-400')
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                {/* Price Display */}
                <div className="space-y-1 text-center py-2">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">{t.calcEstMonthly}</div>
                  <div className="text-4xl sm:text-5xl font-black text-blue-600 font-mono tracking-tight">
                    {displaySek} <span className="text-xl text-slate-400 font-normal">SEK/mo</span>
                  </div>
                  <div className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    (~ €{displayEur} EUR / month billed {calcBillingCycle === 'yearly' ? 'annually' : 'monthly'})
                  </div>
                </div>

                {/* Specification Summary List */}
                <div className={`pt-4 border-t space-y-2 text-xs font-mono ${isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-slate-300'}`}>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Web Storage:</span>
                    <span className="font-bold">{calcStorageGb} GB NVMe</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> MySQL Databases:</span>
                    <span className="font-bold">{calcDbCount} Dedicated</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> FTP &amp; Web Panel:</span>
                    <span className="font-bold">{calcFtpUsers} Users</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Environment:</span>
                    <span className="font-bold">{calcPhpVersion}</span>
                  </div>
                  <div className="flex justify-between text-emerald-500">
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> SSL Security:</span>
                    <span className="font-bold">Included Free</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setProjectType(`Custom Plan (${calcStorageGb}GB NVMe, ${calcDbCount} DB, ${calcFtpUsers} FTP, ${calcPhpVersion}) - ${displaySek} SEK/mo`);
                    setQuoteModalOpen(true);
                  }}
                  className="w-full py-4 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {t.calcOrderBtn}
                </button>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── WEB STORAGE & HOSTING SPECIFIC SECTION ──────────────────── */}
      <section id="hosting" className={`py-20 border-y ${isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-[#070709] border-white/5'}`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-12">

          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-mono font-semibold">
              WEB STORAGE &amp; INFRASTRUCTURE
            </div>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.hostingTitle}
            </h2>
            <p className={`text-base leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {t.hostingSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <HardDrive className="w-6 h-6 text-blue-500" />, title: t.h1Title, desc: t.h1Desc, badge: '10GB SSD' },
              { icon: <Database className="w-6 h-6 text-cyan-500" />, title: t.h2Title, desc: t.h2Desc, badge: 'MySQL DB' },
              { icon: <Key className="w-6 h-6 text-indigo-500" />, title: t.h3Title, desc: t.h3Desc, badge: 'Web Panel' },
              { icon: <Server className="w-6 h-6 text-emerald-500" />, title: t.h4Title, desc: t.h4Desc, badge: 'PHP 8.3' },
            ].map((card, i) => (
              <div key={i} className={`p-6 h-[250px] rounded-3xl border transition-all flex flex-col justify-between ${isLight ? 'bg-white border-slate-200 hover:border-blue-500/40 shadow-sm' : 'bg-[#121216] border-white/10 hover:border-blue-500/40'}`}>
                
                {/* Header section with single line title truncation */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                      {card.icon}
                    </div>
                    <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 font-mono text-[11px] font-bold shrink-0">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className={`text-base sm:text-lg font-bold leading-none tracking-tight truncate whitespace-nowrap overflow-hidden ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {card.title}
                  </h3>
                  <p className={`text-xs leading-relaxed min-h-[36px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{card.desc}</p>
                </div>

                {/* Footer status bar */}
                <div className={`pt-3 border-t flex items-center text-xs font-mono text-emerald-500 gap-1 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Instant Setup
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── SERVICES OFFERED ─────────────────────────────────────────── */}
      <section id="services" className="py-24 max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-mono font-semibold">
            WHAT WE DO
          </div>
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t.servicesTitle}
          </h2>
          <p className={`text-base leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.servicesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: t.s1Title, outcome: t.s1Outcome, desc: t.s1Desc, highlights: t.s1Highlights, icon: <Code2 className="w-8 h-8 text-blue-500" />, badge: 'NEXT.JS 15' },
            { title: t.s2Title, outcome: t.s2Outcome, desc: t.s2Desc, highlights: t.s2Highlights, icon: <ShoppingBag className="w-8 h-8 text-cyan-500" />, badge: 'E-COMMERCE' },
            { title: t.s3Title, outcome: t.s3Outcome, desc: t.s3Desc, highlights: t.s3Highlights, icon: <HardDrive className="w-8 h-8 text-indigo-500" />, badge: '10GB HOSTING' },
            { title: t.s4Title, outcome: t.s4Outcome, desc: t.s4Desc, highlights: t.s4Highlights, icon: <Monitor className="w-8 h-8 text-emerald-500" />, badge: 'PRESENTATIONS' },
          ].map((s, idx) => (
            <div
              key={idx}
              className="agency-card p-8 sm:p-10 rounded-3xl space-y-6 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                    {s.icon}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-mono font-bold">
                    {s.badge}
                  </span>
                </div>

                <h3 className={`text-2xl font-bold group-hover:text-blue-600 transition-colors ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {s.title}
                </h3>

                <p className="text-blue-600 text-sm font-semibold font-mono">
                  "{s.outcome}"
                </p>

                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {s.desc}
                </p>
              </div>

              <div className={`pt-6 border-t space-y-3 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">Includes:</div>
                <ul className={`space-y-2 text-xs font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {s.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ULTRA-SIMPLE EMAIL CTA SECTION ──────────────────────────── */}
      <section id="contact" className="py-20 max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className={`relative rounded-3xl p-8 sm:p-14 md:p-16 border shadow-2xl overflow-hidden ${isLight ? 'bg-gradient-to-br from-white via-slate-50 to-blue-50 border-blue-200' : 'bg-gradient-to-br from-[#121216] via-[#0A0A0C] to-[#121216] border-blue-500/30'}`}>

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 text-xs font-mono font-semibold">
              <Mail className="w-3.5 h-3.5" />
              INSTANT EMAIL QUOTE &amp; HOSTING OFFER
            </div>

            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.ctaTitle}
            </h2>

            <p className={`text-base leading-relaxed max-w-xl mx-auto ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {t.ctaDesc}
            </p>

            {formSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-mono text-sm text-center max-w-md mx-auto space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="font-bold">Proposal &amp; Price Sent!</div>
                <p className="text-xs text-slate-600">
                  Please check your inbox at <span className="font-bold">{emailInput}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuickQuoteSubmit} className="pt-2 max-w-xl mx-auto space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className={`flex-1 px-5 py-4 rounded-xl border text-sm focus:outline-none focus:border-blue-500 transition-all ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#0A0A0C] border-white/10 text-white placeholder-slate-500'}`}
                  />
                  <button
                    type="submit"
                    className="px-7 py-4 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {t.ctaBtn} <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className={`flex flex-wrap items-center justify-center gap-3 text-xs font-mono pt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> 10GB NVMe Web Storage</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> MySQL &amp; Panel Access</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> PHP &amp; FTP</span>
                </div>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className={`border-t pt-16 pb-12 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#060608] border-white/10'}`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className={`grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b ${isLight ? 'border-slate-200' : 'border-white/5'}`}>

            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 flex items-center justify-center">
                  <Image
                   src={staarkLogo} alt="Staark Inc Logo Mark" className="h-8 w-auto object-contain" />
                </div>
                <span className={`font-extrabold text-xl tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Staark <span className="text-blue-600">Inc.</span>
                </span>
              </div>
              <p className={`text-xs max-w-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Bespoke digital design, 10GB web storage hosting, web panel access, MySQL databases, and PHP web development studio for companies in Sweden.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className={`text-xs font-bold font-mono uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.navServices}</h4>
              <ul className={`space-y-2 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <li><a href="#hosting" className="hover:text-blue-600 transition-colors">10GB Web Storage</a></li>
                <li><a href="#hosting" className="hover:text-blue-600 transition-colors">MySQL Database</a></li>
                <li><a href="#hosting" className="hover:text-blue-600 transition-colors">Panel &amp; FTP Access</a></li>
                <li><a href="#services" className="hover:text-blue-600 transition-colors">PHP &amp; Next.js Build</a></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className={`text-xs font-bold font-mono uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Navigation</h4>
              <ul className={`space-y-2 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <li><a href="#hosting" className="hover:text-blue-600 transition-colors">{t.navHosting}</a></li>
                <li><a href="#services" className="hover:text-blue-600 transition-colors">{t.navServices}</a></li>
                <li><a href="#work" className="hover:text-blue-600 transition-colors">{t.navWork}</a></li>
                <li><a href="#contact" className="hover:text-blue-600 transition-colors">{t.getQuoteBtn}</a></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h4 className={`text-xs font-bold font-mono uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Contact &amp; Sweden</h4>
              <p className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>contact@staarkinc.com</p>
              <p className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Stockholm &bull; Sweden &bull; Global</p>
            </div>

          </div>

          <div className={`pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <div>© {new Date().getFullYear()} Staark Inc. All rights reserved. Built with React 19 &amp; Tailwind CSS.</div>
          </div>
        </div>
      </footer>

      {/* ─── QUICK EMAIL QUOTE MODAL ────────────────────────────────────── */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`relative w-full max-w-lg p-8 rounded-3xl border shadow-2xl space-y-6 ${isLight ? 'bg-white border-slate-200' : 'bg-[#121216] border-blue-500/40'}`}>
            <button
              onClick={() => setQuoteModalOpen(false)}
              className={`absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white ${isLight ? 'bg-slate-100 hover:bg-slate-200 hover:text-slate-900' : 'bg-white/5'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-mono text-xs font-bold">
                INSTANT PRICE &amp; OFFER INQUIRY
              </span>
              <h3 className={`text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Get Offer &amp; Price Breakdown</h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Enter your email to receive our web design &amp; 10GB web storage hosting package pricing.
              </p>
            </div>

            {formSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-mono text-sm text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="font-bold">Quote Request Received!</div>
                <p className="text-xs text-slate-500">
                  We've sent our web design &amp; 10GB hosting offer to your email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuickQuoteSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className={`block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Your Email Address:</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.se"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-blue-600 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0A0A0C] border-white/10 text-white'}`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Service Selected:</label>
                  <select
                    value={projectType}
                    onChange={e => setProjectType(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-blue-600 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0A0A0C] border-white/10 text-white'}`}
                  >
                    <option>10GB Web Storage + MySQL &amp; Panel Access</option>
                    <option>Company Welcome / Presentation Page</option>
                    <option>Custom Web Design &amp; Build</option>
                    <option>E-Commerce Storefront</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Optional Note / Current Site URL:</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Need 10GB hosting with MySQL database and FTP access..."
                    value={userNote}
                    onChange={e => setUserNote(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-blue-600 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0A0A0C] border-white/10 text-white'}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl font-extrabold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:scale-[1.01] transition-all cursor-pointer"
                >
                  Send Me Offer &amp; Price
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
