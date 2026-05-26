import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Contact = () => {
  return (
    <div className="bg-[#F9F9F7] overflow-hidden pt-20">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-6 border-b border-[#E5E5E0] pb-4">
            Get In Touch
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            CONTACT
            <br />
            <span className="text-[#CC0000]">US</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12" style={{ fontFamily: "'Lora', serif" }}>
            Have questions? We'd love to hear from you. Contact our support team anytime.
          </p>
        </div>
      </section>

      {/* CONTACT INFO */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-t border-[#111111]">
            <div className="border-r border-b border-[#111111] p-8">
              <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>EMAIL</h3>
              <p className="text-base" style={{ fontFamily: "'Lora', serif" }}>support@passvault.app</p>
            </div>
            <div className="border-r border-b border-[#111111] p-8">
              <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>PHONE</h3>
              <p className="text-base" style={{ fontFamily: "'Lora', serif" }}>(+1) 555-123-4567</p>
            </div>
            <div className="border-r border-b border-[#111111] p-8">
              <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>HOURS</h3>
              <p className="text-base" style={{ fontFamily: "'Lora', serif" }}>24/7 Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* MESSAGE SECTION */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <div className="border-b-2 border-[#111111] mb-12 pb-8">
              <h2 className="text-4xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>SEND US A MESSAGE</h2>
            </div>
            <form className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest font-mono text-[#525252] mb-3">Your Name</label>
                <input
                  type="text"
                  className="w-full border-b-2 border-[#111111] py-4 px-0 bg-transparent text-[#111111] font-serif placeholder-[#A3A3A3] focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-mono text-[#525252] mb-3">Your Email</label>
                <input
                  type="email"
                  className="w-full border-b-2 border-[#111111] py-4 px-0 bg-transparent text-[#111111] font-serif placeholder-[#A3A3A3] focus:outline-none"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-mono text-[#525252] mb-3">Message</label>
                <textarea
                  rows={6}
                  className="w-full border-2 border-[#111111] p-6 bg-transparent text-[#111111] font-serif placeholder-[#A3A3A3] focus:outline-none resize-none"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors"
              >
                SEND MESSAGE
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default Contact;
