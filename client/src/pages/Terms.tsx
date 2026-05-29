import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Terms = () => {
  const sections = [
    {
      title: '1. ACCEPTANCE OF TERMS',
      content: 'By using PassVault, you agree to these Terms of Service. If you do not agree to any part of these terms, you must not use the service.',
    },
    {
      title: '2. USER RESPONSIBILITIES',
      content: 'You are responsible for maintaining the confidentiality of your account and master password. You agree to accept responsibility for all activities that occur under your account.',
    },
    {
      title: '3. LIMITATION OF LIABILITY',
      content: 'PassVault is provided on an "as is" basis. We are not liable for any damages arising from the use or inability to use the service, including but not limited to data loss or security breaches caused by user negligence.',
    },
    {
      title: '4. MODIFICATIONS',
      content: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Continued use of the service after changes constitutes acceptance.',
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
            Legal &nbsp;|&nbsp; Terms of Service &nbsp;|&nbsp; Last Updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <h1
            className="font-black leading-[0.88] tracking-tighter mb-8"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            }}
          >
            TERMS OF<br />
            <span className="text-[#CC0000]">SERVICE</span>
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

export default Terms;
