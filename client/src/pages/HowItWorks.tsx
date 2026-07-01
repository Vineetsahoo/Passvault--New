import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Shield, Share2, Download, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Download the App',
      description: 'Get PassVault from the App Store, Google Play, or download directly from our website. Installation takes under 2 minutes.',
      icon: <Download className="h-8 w-8" />,
    },
    {
      number: '02',
      title: 'Create Your Vault',
      description: 'Set a master password to protect all your passes and credentials. This password encrypts everything locally before transmission.',
      icon: <Shield className="h-8 w-8" />,
    },
    {
      number: '03',
      title: 'Scan or Upload',
      description: 'Use your camera to scan QR codes or upload passes manually. Our intelligent parser handles multiple formats automatically.',
      icon: <QrCode className="h-8 w-8" />,
    },
    {
      number: '04',
      title: 'Access Anywhere',
      description: 'Your passes sync across all devices instantly. Organise, categorise, and access from desktop, mobile, or tablet.',
      icon: <Share2 className="h-8 w-8" />,
    },
  ];

  const guide = [
    {
      title: 'Installation',
      fig: 'Fig. 2.1',
      details: 'Download PassVault from your device\'s app store or visit our website. The installation is lightweight and takes less than 2 minutes on any platform.',
    },
    {
      title: 'Account Setup',
      fig: 'Fig. 2.2',
      details: 'Create your account with a strong master password. This password encrypts all your data locally before any network transmission occurs.',
    },
    {
      title: 'Import Your Passes',
      fig: 'Fig. 2.3',
      details: 'Add passes by scanning QR codes with your device camera or uploading files directly. Our intelligent parser supports multiple formats out of the box.',
    },
    {
      title: 'Organise & Secure',
      fig: 'Fig. 2.4',
      details: 'Categorise your passes, set expiration reminders, and enable two-factor authentication for maximum security across all your devices.',
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
            Page 5 &nbsp;|&nbsp; Getting Started &nbsp;|&nbsp; Step-by-Step
          </div>
          <h1
            className="font-black leading-[0.88] tracking-tighter mb-8"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            }}
          >
            HOW IT<br />
            <span className="text-[#CC0000]">WORKS</span>
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed text-[#525252]"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Get started with PassVault in four simple steps. From download to full access — it takes less than five minutes.
          </p>
        </div>
      </section>

      {/* ── STEPS GRID ───────────────────────────────────────────────────── */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000] newsprint-texture">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-[#404040]">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="border-r border-b border-[#404040] p-8 hover:bg-[#1a1a1a] transition-colors group"
              >
                <div className="flex items-start gap-6">
                  <div className="border border-[#F9F9F7] w-16 h-16 flex items-center justify-center flex-shrink-0 group-hover:bg-[#CC0000] group-hover:border-[#CC0000] transition-all duration-200">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-[#CC0000] font-bold text-xs tracking-widest mb-2"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      STEP {step.number}
                    </div>
                    <h3
                      className="text-2xl font-black mb-3"
                      style={{ fontFamily: "'Playfair Display', serif", color: '#F9F9F7' }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed text-[#A3A3A3]"
                      style={{ fontFamily: "'Lora', serif" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ORNAMENTAL DIVIDER ───────────────────────────────────────────── */}
      <div className="divider-ornamental border-b border-[#E5E5E0]">
        &#x2727; &#x2727; &#x2727;
      </div>

      {/* ── DETAILED GUIDE ───────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-4 border-[#111111] mb-12 pb-8">
            <div
              className="text-[0.65rem] uppercase tracking-[0.2em] text-[#525252] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Detailed Walkthrough
            </div>
            <h2
              className="font-black"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              }}
            >
              DETAILED GUIDE
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-t border-[#111111]">
            {guide.map((item, idx) => (
              <div key={idx} className="border-r border-b border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors">
                <div
                  className="text-[0.6rem] uppercase tracking-widest text-[#CC0000] font-bold mb-4"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {item.fig}
                </div>
                <h3
                  className="text-xl font-black mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed text-[#525252]"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {item.details}
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
              READY TO GET STARTED?
            </h2>
            <p
              className="text-lg mb-8 max-w-2xl mx-auto text-[#525252]"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Download PassVault today and secure your digital passes in minutes.
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

export default HowItWorks;
