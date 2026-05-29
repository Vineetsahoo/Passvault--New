import React from 'react';
import { Download, ArrowRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const DownloadNow = () => {
  const platforms = [
    { platform: 'iOS',     requirement: 'iOS 14.0 or later',     icon: '📱' },
    { platform: 'Android', requirement: 'Android 8.0 or later',  icon: '📱' },
    { platform: 'Windows', requirement: 'Windows 10 or later',   icon: '🖥' },
    { platform: 'MacOS',   requirement: 'MacOS 10.15 or later',  icon: '🍎' },
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
            Get The App &nbsp;|&nbsp; All Platforms &nbsp;|&nbsp; Free Trial
          </div>
          <h1
            className="font-black leading-[0.88] tracking-tighter mb-8"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            }}
          >
            DOWNLOAD<br />
            <span className="text-[#CC0000]">NOW</span>
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed text-[#525252]"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Available on iOS, Android, Web, and Desktop. Sync everything seamlessly across all your devices.
          </p>
          <div className="flex flex-wrap gap-4">
            {['30-day free trial', 'No credit card required', 'Cancel anytime'].map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-sm" style={{ fontFamily: "'Lora', serif" }}>
                <Check className="h-4 w-4 text-[#CC0000]" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD GRID ────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-l border-t border-[#111111]">
            {platforms.map((item) => (
              <div
                key={item.platform}
                className="border-r border-b border-[#111111] p-8 text-center hover:bg-[#E5E5E0] transition-colors hard-shadow-hover"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3
                  className="text-2xl font-black mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {item.platform}
                </h3>
                <p
                  className="text-xs text-[#525252] mb-6"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {item.requirement}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <Download className="h-4 w-4" /> DOWNLOAD
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SYSTEM REQUIREMENTS ──────────────────────────────────────────── */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-2 border-[#404040] mb-12 pb-8">
            <div
              className="text-[0.65rem] uppercase tracking-[0.2em] text-[#737373] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Technical Specifications
            </div>
            <h2
              className="font-black"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#F9F9F7' }}
            >
              SYSTEM REQUIREMENTS
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-l border-t border-[#404040]">
            {platforms.map((item, idx) => (
              <div key={idx} className="border-r border-b border-[#404040] p-6 hover:bg-[#1a1a1a] transition-colors">
                <div
                  className="text-[#CC0000] font-bold text-xs tracking-widest mb-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  [{String(idx + 1).padStart(2, '0')}]
                </div>
                <h3
                  className="text-xl font-black mb-2"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#F9F9F7' }}
                >
                  {item.platform}
                </h3>
                <p className="text-sm text-[#A3A3A3]" style={{ fontFamily: "'Lora', serif" }}>
                  {item.requirement}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default DownloadNow;
