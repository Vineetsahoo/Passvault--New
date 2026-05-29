import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Privacy = () => {
  const sections = [
    {
      title: 'INFORMATION WE COLLECT',
      content: 'We collect information you provide directly to us, such as your name, email address, and account information. We also collect information about your device and how you interact with our service. Your passwords and passes are encrypted locally and never transmitted in plaintext.',
    },
    {
      title: 'HOW WE USE YOUR DATA',
      content: 'We use your information to provide, maintain, and improve our services. We never sell your data to third parties and we don\'t use your data for marketing purposes without your explicit consent. Analytics data is aggregated and anonymised.',
    },
    {
      title: 'DATA SECURITY',
      content: 'We implement industry-standard security measures to protect your data. All data is encrypted both in transit and at rest using AES-256 encryption. Our zero-knowledge architecture means even we cannot access your stored passes.',
    },
    {
      title: 'YOUR RIGHTS',
      content: 'You have the right to access, correct, or delete your personal data at any time. You can request a copy of your data, withdraw consent for data processing, or request complete account deletion through your settings.',
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
            Legal &nbsp;|&nbsp; Privacy Policy &nbsp;|&nbsp; Last Updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <h1
            className="font-black leading-[0.88] tracking-tighter mb-8"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            }}
          >
            PRIVACY<br />
            <span className="text-[#CC0000]">POLICY</span>
          </h1>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111] newsprint-texture">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="border-l border-[#111111]">
              {sections.map((s, idx) => (
                <div key={idx} className="border-b border-r border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors">
                  <div
                    className="text-[0.6rem] uppercase tracking-widest text-[#CC0000] font-bold mb-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Section {String(idx + 1).padStart(2, '0')}
                  </div>
                  <h2
                    className="text-2xl font-black mb-4"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.title}
                  </h2>
                  <p
                    className="text-base leading-relaxed text-[#525252]"
                    style={{ fontFamily: "'Lora', serif" }}
                  >
                    {s.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default Privacy;
