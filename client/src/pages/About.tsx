import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const About = () => {
  const values = [
    { title: 'Security First', description: 'Every decision we make starts with your security.' },
    { title: 'User Privacy', description: 'Your data is yours. We never sell or share it.' },
    { title: 'Simplicity', description: 'Powerful technology should feel effortless to use.' },
    { title: 'Innovation', description: 'We continuously push the boundaries of digital security.' },
  ];

  const milestones = [
    { year: '2024', event: 'PassVault founded with a mission to simplify digital pass management.' },
    { year: '2024', event: 'First 10,000 users onboarded within the first 3 months of launch.' },
    { year: '2025', event: 'Multi-device sync and QR scanning features released.' },
    { year: '2026', event: '50,000+ active users. Zero security breaches maintained.' },
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
            About PassVault &nbsp;|&nbsp; Our Story &nbsp;|&nbsp; Est. 2024
          </div>
          <h1
            className="font-black leading-[0.88] tracking-tighter mb-8"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            }}
          >
            OUR<br />
            <span className="text-[#CC0000]">MISSION</span>
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed text-[#525252]"
            style={{ fontFamily: "'Lora', serif" }}
          >
            To secure and simplify digital pass management for everyone — from individuals to enterprises.
          </p>
        </div>
      </section>

      {/* ── STORY + VALUES ───────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111] newsprint-texture">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Story — 7 cols */}
            <div className="lg:col-span-7 border-r border-[#E5E5E0] pr-0 lg:pr-12 pb-12 lg:pb-0">
              <div className="border-b-4 border-[#111111] pb-6 mb-8">
                <h2
                  className="font-black"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                  }}
                >
                  OUR STORY
                </h2>
              </div>
              <p
                className="text-base leading-relaxed mb-6 text-[#525252] drop-cap"
                style={{ fontFamily: "'Lora', serif" }}
              >
                PassVault was founded in 2024 with a simple idea: managing digital passes shouldn't be complicated or unsafe. We saw a world where people struggled with disorganised passes, expired tickets, and insecure storage methods — and we decided to build something better.
              </p>
              <p
                className="text-base leading-relaxed text-[#525252]"
                style={{ fontFamily: "'Lora', serif" }}
              >
                We believe everyone deserves a secure, elegant way to store and access their important passes, tickets, and credentials. Our zero-knowledge architecture ensures that even we cannot access your data — only you hold the keys.
              </p>
            </div>

            {/* Values — 5 cols */}
            <div className="lg:col-span-5 pl-0 lg:pl-12">
              <div className="border-b-4 border-[#111111] pb-6 mb-8">
                <h2
                  className="font-black"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                  }}
                >
                  OUR VALUES
                </h2>
              </div>
              <div className="border-l border-t border-[#111111]">
                {values.map((value, idx) => (
                  <div key={idx} className="border-r border-b border-[#111111] p-6 hover:bg-[#E5E5E0] transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-[#CC0000] font-black text-lg mt-0.5">■</span>
                      <div>
                        <h4 className="font-black text-sm mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {value.title}
                        </h4>
                        <p className="text-xs text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-4 border-[#111111] pb-6 mb-0">
            <div
              className="text-[0.65rem] uppercase tracking-[0.2em] text-[#525252] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Company Timeline
            </div>
            <h2
              className="font-black"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 5vw, 3rem)',
              }}
            >
              KEY MILESTONES
            </h2>
          </div>
          <div className="border-l border-[#111111]">
            {milestones.map((m, idx) => (
              <div key={idx} className="border-r border-b border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors flex items-start gap-6">
                <span
                  className="text-[#CC0000] font-black text-lg flex-shrink-0"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {m.year}
                </span>
                <div className="w-2 h-2 bg-[#111111] flex-shrink-0 mt-2" />
                <p className="text-sm leading-relaxed text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  {m.event}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2
            className="font-black mb-6"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#F9F9F7' }}
          >
            BUILT BY EXPERTS
          </h2>
          <p
            className="text-lg mb-8 max-w-2xl mx-auto text-[#A3A3A3] leading-relaxed"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Our team brings together security experts, designers, and engineers committed to your digital safety.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#FF3333] transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            CONTACT US <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default About;
