import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Privacy = () => {
  return (
    <div className="bg-[#F9F9F7] overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-6 border-b border-[#E5E5E0] pb-4">
            Legal
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            PRIVACY
            <br />
            <span className="text-[#CC0000]">POLICY</span>
          </h1>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>INFORMATION WE COLLECT</h2>
                <p className="text-base leading-relaxed text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  We collect information you provide directly to us, such as your name, email address, and account information. We also collect information about your device and how you interact with our service.
                </p>
              </div>
              <div>
                <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>HOW WE USE YOUR DATA</h2>
                <p className="text-base leading-relaxed text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  We use your information to provide, maintain, and improve our services. We never sell your data to third parties and we don't use your data for marketing purposes without explicit consent.
                </p>
              </div>
              <div>
                <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>DATA SECURITY</h2>
                <p className="text-base leading-relaxed text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  We implement industry-standard security measures to protect your data. All data is encrypted both in transit and at rest using AES-256 encryption.
                </p>
              </div>
              <div>
                <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>YOUR RIGHTS</h2>
                <p className="text-base leading-relaxed text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  You have the right to access, correct, or delete your personal data at any time. You can also request a copy of your data or withdraw consent for data processing.
                </p>
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

export default Privacy;
