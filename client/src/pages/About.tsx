import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const About = () => {
  return (
    <div className="bg-[#F9F9F7] overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-6 border-b border-[#E5E5E0] pb-4">
            About PassVault
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            OUR
            <br />
            <span className="text-[#CC0000]">MISSION</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12" style={{ fontFamily: "'Lora', serif" }}>
            To secure and simplify digital pass management for everyone.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>OUR STORY</h2>
              <p className="text-base leading-relaxed mb-6" style={{ fontFamily: "'Lora', serif" }}>
                PassVault was founded in 2024 with a simple idea: managing digital passes shouldn't be complicated or unsafe.
              </p>
              <p className="text-base leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                We believe everyone deserves a secure, elegant way to store and access their important passes, tickets, and credentials.
              </p>
            </div>
            <div>
              <h2 className="text-4xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>OUR VALUES</h2>
              <ul className="space-y-4">
                {['Security First', 'User Privacy', 'Simplicity', 'Innovation'].map((value) => (
                  <li key={value} className="flex items-start gap-3 text-base">
                    <span className="text-[#CC0000] font-black mt-0.5">■</span>
                    <span style={{ fontFamily: "'Lora', serif" }}>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            BUILT BY EXPERTS
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ fontFamily: "'Lora', serif" }}>
            Our team brings together security experts, designers, and engineers committed to your digital safety.
          </p>
          <Link to="/contact" className="inline-block px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#FF3333]">
            CONTACT US
          </Link>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default About;
