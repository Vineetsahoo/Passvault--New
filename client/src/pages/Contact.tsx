import React from 'react';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Contact = () => {
  const contactInfo = [
    { label: 'EMAIL', value: 'support@passvault.app', fig: 'Fig. C.1' },
    { label: 'PHONE', value: '(+1) 555-123-4567', fig: 'Fig. C.2' },
    { label: 'HOURS', value: '24/7 Support — Always Available', fig: 'Fig. C.3' },
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
            Get In Touch &nbsp;|&nbsp; Support &nbsp;|&nbsp; 24/7
          </div>
          <h1
            className="font-black leading-[0.88] tracking-tighter mb-8"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            }}
          >
            CONTACT<br />
            <span className="text-[#CC0000]">US</span>
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed text-[#525252]"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Have questions? We'd love to hear from you. Contact our support team anytime — we respond within 2 hours.
          </p>
        </div>
      </section>

      {/* ── CONTACT INFO GRID ────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-0">
          <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-[#111111]">
            {contactInfo.map((item, idx) => (
              <div key={idx} className="border-r border-b border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors">
                <div
                  className="text-[0.6rem] uppercase tracking-widest text-[#CC0000] font-bold mb-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {item.fig}
                </div>
                <h3
                  className="text-xl font-black mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {item.label}
                </h3>
                <p className="text-base text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ─────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111] newsprint-texture">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Form — 7 cols */}
            <div className="lg:col-span-7 border-r border-[#E5E5E0] pr-0 lg:pr-12">
              <div className="border-b-4 border-[#111111] mb-10 pb-6">
                <h2
                  className="font-black"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                  }}
                >
                  SEND US A MESSAGE
                </h2>
              </div>
              <form className="space-y-8">
                <div>
                  <label
                    className="block text-[0.65rem] uppercase tracking-[0.2em] mb-3 text-[#525252]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    className="input-newsprint"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label
                    className="block text-[0.65rem] uppercase tracking-[0.2em] mb-3 text-[#525252]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Your Email
                  </label>
                  <input
                    type="email"
                    className="input-newsprint"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label
                    className="block text-[0.65rem] uppercase tracking-[0.2em] mb-3 text-[#525252]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Message
                  </label>
                  <textarea
                    rows={6}
                    className="w-full border-2 border-[#111111] p-6 bg-transparent text-[#111111] placeholder-[#A3A3A3] focus:outline-none focus:bg-[#F0F0F0] resize-none transition-colors"
                    style={{ fontFamily: "'Lora', serif" }}
                    placeholder="Your message..."
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors hard-shadow-hover"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  SEND MESSAGE <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Info sidebar — 5 cols */}
            <div className="lg:col-span-5 pl-0 lg:pl-12 pt-12 lg:pt-0">
              <div className="border-4 border-[#111111] p-8 bg-[#111111] text-[#F9F9F7] hard-shadow-red">
                <div
                  className="text-[0.6rem] uppercase tracking-widest text-[#CC0000] font-bold mb-4"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Response Guarantee
                </div>
                <h3
                  className="text-2xl font-black mb-4"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#F9F9F7' }}
                >
                  WE REPLY IN<br />UNDER 2 HOURS
                </h3>
                <p
                  className="text-sm leading-relaxed text-[#A3A3A3] mb-6"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  Our support team is available around the clock. Whether it's a bug report, feature request, or general question — we're here to help.
                </p>
                <div className="border-t border-[#404040] pt-6 space-y-3">
                  {[
                    '24/7 live support',
                    'Average response: 45 min',
                    'Dedicated account managers for Enterprise',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-[#CC0000]">■</span>
                      <span style={{ fontFamily: "'Lora', serif" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default Contact;
