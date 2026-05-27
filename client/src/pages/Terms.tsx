import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Terms = () => {
  return (
    <div className="bg-[#F9F9F7] overflow-hidden pt-28">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-6 border-b border-[#E5E5E0] pb-4">
            Legal
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            TERMS OF
            <br />
            <span className="text-[#CC0000]">SERVICE</span>
          </h1>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>1. ACCEPTANCE OF TERMS</h2>
                <p className="text-base leading-relaxed text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  By using PassVault, you agree to these Terms of Service. If you do not agree, do not use the service.
                </p>
              </div>
              <div>
                <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>2. USER RESPONSIBILITIES</h2>
                <p className="text-base leading-relaxed text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                </p>
              </div>
              <div>
                <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>3. LIMITATION OF LIABILITY</h2>
                <p className="text-base leading-relaxed text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  PassVault is provided on an "as is" basis. We are not liable for any damages arising from the use or inability to use the service.
                </p>
              </div>
              <div>
                <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>4. MODIFICATIONS</h2>
                <p className="text-base leading-relaxed text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website.
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

export default Terms;
