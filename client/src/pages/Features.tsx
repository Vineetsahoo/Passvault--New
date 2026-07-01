import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cloud, Lock, TrendingUp, Users, Smartphone, ArrowRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Features = () => {
  const features = [
    {
      title: 'Secure Storage',
      icon: <Shield className="h-8 w-8" />,
      description: 'Military-grade AES-256 encryption protects every password and digital pass you store.',
      href: '/features/secure-storage',
    },
    {
      title: 'Multi-Device Sync',
      icon: <Cloud className="h-8 w-8" />,
      description: 'Real-time synchronisation across all your devices — desktop, mobile, and tablet.',
      href: '/features/multi-device',
    },
    {
      title: 'Advanced Security',
      icon: <Lock className="h-8 w-8" />,
      description: 'Two-factor authentication and biometric security options for maximum protection.',
      href: '/features/secure-storage',
    },
    {
      title: 'Smart Analytics',
      icon: <TrendingUp className="h-8 w-8" />,
      description: 'Track your pass usage and security health at a glance with intuitive dashboards.',
      href: '/features/alerts',
    },
    {
      title: 'Secure Sharing',
      icon: <Users className="h-8 w-8" />,
      description: 'Share passes with family and team members via granular, permission-based access.',
      href: '/features/sharing',
    },
    {
      title: 'Mobile First',
      icon: <Smartphone className="h-8 w-8" />,
      description: 'Native apps for iOS and Android with full feature parity to the web platform.',
      href: '/features/qr-scan',
    },
  ];

  const securityDetails = [
    {
      title: 'End-to-End Encryption',
      description: 'Your data is encrypted on your device before it ever leaves — we cannot read it.',
    },
    {
      title: 'Zero-Knowledge Architecture',
      description: 'Even our servers have no access to your data. Only you hold the keys.',
    },
    {
      title: 'Biometric Authentication',
      description: 'Unlock with fingerprint or face recognition for frictionless, secure access.',
    },
    {
      title: 'Third-Party Security Audits',
      description: 'Regular independent penetration testing keeps our codebase battle-hardened.',
    },
  ];

  return (
    <div className="bg-[#F9F9F7] overflow-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="border-b-4 border-[#111111] pt-[5.5rem] md:pt-[6.5rem]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div
            className="text-[0.65rem] uppercase tracking-[0.2em] text-[#525252] mb-6 pb-4 border-b border-[#E5E5E0]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Page 2 &nbsp;|&nbsp; Feature Showcase &nbsp;|&nbsp; What We Offer
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-8 border-r border-[#E5E5E0] pr-0 lg:pr-10">
              <h1
                className="font-black leading-[0.88] tracking-tighter mb-8"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                }}
              >
                POWERFUL<br />
                FEATURES<br />
                <span className="text-[#CC0000]">INCLUDED</span>
              </h1>
              <p
                className="text-lg md:text-xl max-w-2xl mb-10 leading-relaxed text-[#525252]"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Everything you need to secure and organise your digital passes in one elegant, editor-approved platform.
              </p>
              <Link
                to="/download"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors hard-shadow-hover"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                GET STARTED <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="lg:col-span-4 pl-0 lg:pl-10 pt-8 lg:pt-0 flex flex-col justify-end">
              {/* Quick feature index */}
              <div
                className="text-[0.6rem] uppercase tracking-widest text-[#737373] mb-4"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                In This Issue
              </div>
              {features.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-[#E5E5E0] py-3">
                  <span
                    className="text-[0.6rem] text-[#CC0000] font-bold mt-0.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {String(i + 1).padStart(2, '0')} —
                  </span>
                  <span
                    className="text-sm font-bold text-[#111111]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {f.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ───────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111] newsprint-texture">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-[#111111]">
            {features.map((feature, idx) => (
              <Link
                key={idx}
                to={feature.href}
                className="border-r border-b border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors hard-shadow-hover group"
              >
                <div className="border border-[#111111] w-14 h-14 flex items-center justify-center mb-6 group-hover:bg-[#111111] group-hover:text-[#F9F9F7] transition-all duration-200">
                  {feature.icon}
                </div>
                <h3
                  className="text-xl font-black mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed text-[#525252]"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-[0.65rem] uppercase tracking-widest text-[#CC0000] font-bold group-hover:gap-2 transition-all"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Learn More <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY SECTION (INVERTED) ──────────────────────────────────── */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-2 border-[#404040] mb-12 pb-8">
            <div
              className="text-[0.65rem] uppercase tracking-[0.2em] text-[#737373] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Security Architecture &mdash; How We Protect You
            </div>
            <h2
              className="font-black"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                color: '#F9F9F7',
              }}
            >
              BUILT FOR SECURITY
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-[#404040]">
            {securityDetails.map((item, idx) => (
              <div key={idx} className="border-r border-b border-[#404040] p-8 hover:bg-[#1a1a1a] transition-colors">
                <div className="text-[#CC0000] font-black text-xs tracking-widest mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  [{String(idx + 1).padStart(2, '0')}]
                </div>
                <h3
                  className="text-xl font-black mb-3"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#F9F9F7' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed text-[#A3A3A3]"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="border-4 border-[#111111] p-12 hard-shadow">
            <h2
              className="font-black mb-6"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              }}
            >
              READY TO SECURE YOUR PASSES?
            </h2>
            <p
              className="text-lg mb-8 max-w-2xl mx-auto text-[#525252]"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Join thousands of users who trust PassVault with their most sensitive digital data.
            </p>
            <Link
              to="/download"
              className="inline-flex items-center gap-2 px-10 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              DOWNLOAD NOW <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default Features;
