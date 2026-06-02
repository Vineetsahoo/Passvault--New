import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, QrCode, Clock, RefreshCw, Users, Check, Star, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

/* ─── Ticker data ───────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  { badge: 'SECURE', text: '50,000+ Active Users' },
  { badge: 'NEW',    text: 'QR Code Scanning Released' },
  { badge: 'STAT',   text: '10 Million+ Passes Stored' },
  { badge: 'LIVE',   text: '99.9% Uptime Guarantee' },
  { badge: 'AWARD',  text: 'Zero Security Breaches' },
  { badge: 'UPDATE', text: 'Multi-Device Sync Available' },
  { badge: 'SECURE', text: 'AES-256 Military Encryption' },
  { badge: 'STAT',   text: '30-Day Free Trial — No Card Required' },
];

const Ticker = () => {
  // Double the items so the loop is seamless
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker-wrap py-0">
      <div className="ticker-track">
        {items.map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-badge">{item.badge}</span>
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─── Home Page ─────────────────────────────────────────────────────────── */
const Home = () => {
  const features = [
    { num: '01', icon: <Shield className="h-6 w-6" />,    title: 'Secure Storage',  description: 'Military-grade AES-256 encryption for your peace of mind. Zero-knowledge architecture ensures only you can access your data.' },
    { num: '02', icon: <Smartphone className="h-6 w-6" />, title: 'Multi-Device',   description: 'Access your passes across all devices seamlessly. Changes sync instantly across mobile, tablet, and desktop.' },
    { num: '03', icon: <QrCode className="h-6 w-6" />,    title: 'QR Scanning',    description: 'Instant pass capture using your device camera. Our intelligent parser supports multiple QR formats out of the box.' },
    { num: '04', icon: <Clock className="h-6 w-6" />,     title: 'Smart Alerts',   description: 'Never miss a pass expiration. Configurable reminders keep you ahead of critical deadlines automatically.' },
    { num: '05', icon: <RefreshCw className="h-6 w-6" />, title: 'Auto-Sync',      description: 'Changes propagate in real time. Your vault stays consistent across every device without any manual effort.' },
    { num: '06', icon: <Users className="h-6 w-6" />,     title: 'Share Safely',   description: 'Securely share passes with family or team members. Granular permissions let you control access precisely.' },
  ];

  const testimonials = [
    { quote: 'PassVault transformed how I manage my digital passes. Clean interface, unmatched security.',  author: 'Priya Sharma',  role: 'Business Owner' },
    { quote: 'Auto-sync across devices works flawlessly. No more lost passes or missed deadlines.',         author: 'Rahul Verma',   role: 'Software Engineer' },
    { quote: 'QR code scanning saves me hours every week. Genuinely the best tool I have found.',          author: 'Ananya Patel',  role: 'Student' },
    { quote: 'Finally, a solution that puts security and simplicity first. Highly recommended.',            author: 'Vikram Singh',  role: 'Entrepreneur' },
  ];

  const stats = [
    { number: '50K+',  label: 'Active Users' },
    { number: '10M+',  label: 'Passes Stored' },
    { number: '99.9%', label: 'Uptime' },
    { number: '0',     label: 'Security Breaches' },
  ];

  return (
    <div className="bg-[#F9F9F7] overflow-hidden" style={{ fontFamily: "'Lora', serif" }}>
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="border-b-4 border-[#111111] pt-[5.5rem] md:pt-[6.5rem]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-0">

          {/* Edition dateline */}
          <div
            className="flex items-center gap-6 mb-6 pb-4 border-b border-[#E5E5E0]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#525252]">
              Vol. I &nbsp;|&nbsp; {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &nbsp;|&nbsp; Security Edition
            </span>
            <div className="flex-1 h-px bg-[#E5E5E0]" />
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#CC0000] font-bold">
              ★ EDITOR'S CHOICE
            </span>
          </div>

          {/* Asymmetric 8/4 hero grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

            {/* Left: headline col (8) */}
            <div className="lg:col-span-8 border-r border-[#E5E5E0] pr-0 lg:pr-10 pb-12">
              <h1
                className="font-black leading-[0.88] tracking-tighter text-[#111111] mb-8"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(3.5rem, 11vw, 9rem)',
                }}
              >
                MASTER<br />
                YOUR<br />
                <span className="text-[#CC0000]">PASS</span><br />
                VAULT
              </h1>

              <p
                className="text-lg md:text-xl mb-8 max-w-xl leading-relaxed text-[#525252] drop-cap"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Military-grade encryption meets elegant simplicity. Your digital passes, perfectly organised and always secure — across every device you own.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-0 mb-10">
                <Link
                  to="/download"
                  className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2 justify-center sm:justify-start hard-shadow-hover"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  DOWNLOAD NOW <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="px-8 py-4 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors flex items-center gap-2 justify-center sm:justify-start"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  EXPLORE →
                </Link>
              </div>

              {/* Press mentions */}
              <div className="border-t border-[#E5E5E0] pt-6">
                <div
                  className="text-[0.6rem] uppercase tracking-[0.2em] text-[#737373] mb-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  As Seen In
                </div>
                <div className="flex gap-6 flex-wrap">
                  {['Tech Weekly', 'Security Daily', 'Digital Vault', 'CyberNews'].map(pub => (
                    <span
                      key={pub}
                      className="text-xs uppercase tracking-widest font-bold text-[#111111]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {pub}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: visual col (4) */}
            <div className="lg:col-span-4 pl-0 lg:pl-10 pb-12 flex flex-col gap-0 justify-end">
              {/* Hero image */}
              <div className="border-4 border-[#111111] aspect-square overflow-hidden mb-0">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="PassVault — Secure Your Digital Life"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              {/* Caption strip */}
              <div className="border-l border-r border-b border-[#111111] px-4 py-3 bg-[#111111]">
                <div
                  className="text-[0.6rem] uppercase tracking-[0.18em] text-[#A3A3A3] mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Fig. 1.1 — Security Level
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2 flex-1"
                      style={{ backgroundColor: i < 4 ? '#CC0000' : '#404040' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breaking news ticker */}
        <Ticker />
      </section>

      {/* ── FEATURES GRID ───────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111] newsprint-texture">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Section header */}
          <div className="border-b-4 border-[#111111] mb-0 pb-8">
            <div
              className="text-[0.65rem] uppercase tracking-[0.2em] text-[#525252] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Core Features &mdash; What Makes Us Different
            </div>
            <h2
              className="font-black leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 6vw, 4.5rem)',
              }}
            >
              EVERYTHING YOU NEED
            </h2>
          </div>

          {/* 3-col collapsed grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-l border-[#111111]">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden border-r border-b border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors hard-shadow-hover group"
              >
                {/* Edition number — slides in from top-right on hover */}
                <span
                  aria-hidden="true"
                  className="absolute top-4 right-5 text-5xl font-black leading-none select-none pointer-events-none text-[#111111] opacity-0 -translate-y-2 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200 ease-out"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {feature.num}
                </span>

                {/* Icon box — inverts on hover */}
                <div className="border border-[#111111] w-14 h-14 flex items-center justify-center mb-6 group-hover:bg-[#111111] group-hover:text-[#F9F9F7] transition-all duration-200">
                  {feature.icon}
                </div>

                {/* Title — red underline slides in on hover */}
                <h3
                  className="text-xl font-black mb-3 underline decoration-transparent decoration-2 underline-offset-4 group-hover:decoration-[#CC0000] transition-all duration-200 ease-out"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {feature.title}
                </h3>

                {/* Body — matching red underline on hover */}
                <p
                  className="text-sm leading-relaxed text-[#525252] text-justify-news underline decoration-transparent decoration-[1.5px] underline-offset-4 group-hover:decoration-[#CC0000] transition-all duration-200 ease-out"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ORNAMENTAL DIVIDER ───────────────────────────────────────────── */}
      <div className="divider-ornamental border-b border-[#E5E5E0]">
        &#x2727; &#x2727; &#x2727;
      </div>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-4 border-[#111111] mb-0 pb-8">
            <div
              className="text-[0.65rem] uppercase tracking-[0.2em] text-[#525252] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Reader Testimonials &mdash; Verified Users
            </div>
            <h2
              className="font-black"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 6vw, 4.5rem)',
              }}
            >
              FROM OUR READERS
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 border-l border-[#111111]">
            {testimonials.map((test, idx) => (
              <div
                key={idx}
                className="border-r border-b border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#CC0000] text-[#CC0000]" />
                  ))}
                </div>
                <p
                  className="text-lg mb-6 font-black italic leading-relaxed"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  &ldquo;{test.quote}&rdquo;
                </p>
                <div className="border-t border-[#E5E5E0] pt-4 flex items-center gap-4">
                  <div className="w-10 h-10 border border-[#111111] bg-[#E5E5E0] flex items-center justify-center text-sm font-black">
                    {test.author[0]}
                  </div>
                  <div>
                    <div className="font-black text-sm">{test.author}</div>
                    <div
                      className="text-[0.6rem] uppercase tracking-widest text-[#737373] flex items-center gap-1"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {test.role} <Check className="h-3 w-3 text-[#CC0000]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INVERTED STATS / CTA ─────────────────────────────────────────── */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000] newsprint-texture">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

            {/* CTA col */}
            <div className="lg:col-span-7 border-r border-[#404040] pr-0 lg:pr-12 pb-12 lg:pb-0">
              <div
                className="text-[0.65rem] uppercase tracking-[0.2em] text-[#737373] mb-6 pb-4 border-b border-[#404040]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Ready to Start &mdash; No Credit Card Required
              </div>
              <h2
                className="font-black leading-[0.88] mb-8"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(3rem, 8vw, 6rem)',
                  color: '#F9F9F7',
                }}
              >
                JOIN<br />
                THOUSANDS
              </h2>
              <p
                className="text-lg mb-8 text-[#A3A3A3] max-w-md leading-relaxed"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Begin your journey to a more organised digital life. Your security is our priority — always.
              </p>
              <div className="space-y-3 mb-10">
                {[
                  'Military-grade AES-256 encryption',
                  'Zero-knowledge architecture',
                  '30-day free trial, cancel anytime',
                  'Cross-platform sync included',
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <Check className="h-5 w-5 text-[#CC0000] flex-shrink-0" />
                    <span className="text-base" style={{ fontFamily: "'Lora', serif" }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/download"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#FF3333] transition-colors hard-shadow-hover-red"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                GET STARTED FREE <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Stats col */}
            <div className="lg:col-span-5 pt-12 lg:pt-0 pl-0 lg:pl-12">
              <div className="grid grid-cols-2 border-l border-t border-[#404040]">
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="border-r border-b border-[#404040] p-8 hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div
                      className="font-black mb-2 leading-none text-[#CC0000]"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                      }}
                    >
                      {stat.number}
                    </div>
                    <div
                      className="text-[0.6rem] uppercase tracking-[0.18em] text-[#737373]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-4 border-[#111111] p-12 md:p-16 text-center hard-shadow">
            <p
              className="text-[0.65rem] uppercase tracking-[0.25em] text-[#525252] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Final Edition &mdash; Your Security Awaits
            </p>
            <h2
              className="font-black mb-6"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 6vw, 4rem)',
              }}
            >
              DON&rsquo;T WAIT<br />ANY LONGER
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto mb-10 text-[#525252] leading-relaxed"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Your digital security is too important to leave to chance. Start protecting your passes today — free for 30 days.
            </p>
            <Link
              to="/download"
              className="inline-flex items-center gap-3 px-12 py-5 bg-[#CC0000] text-[#F9F9F7] font-black uppercase tracking-widest hover:bg-[#990000] transition-colors text-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              DOWNLOAD NOW &nbsp;→
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default Home;
