import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is PassVault?',
          a: 'PassVault is a secure digital pass management platform that encrypts and organizes all your important passes, tickets, and credentials in one place.'
        },
        {
          q: 'How is PassVault different from other password managers?',
          a: 'PassVault specializes in managing physical passes and tickets, not just passwords. We focus on ease of use with QR code scanning and multi-device synchronization.'
        },
        {
          q: 'Is PassVault available on mobile?',
          a: 'Yes, PassVault has native apps for iOS and Android with full feature parity to our web platform.'
        }
      ]
    },
    {
      category: 'Security',
      questions: [
        {
          q: 'How secure is my data in PassVault?',
          a: 'We use military-grade AES-256 encryption, zero-knowledge architecture, and regular third-party security audits to ensure your data remains secure.'
        },
        {
          q: 'What happens if I forget my master password?',
          a: 'For security reasons, we cannot recover your master password. However, you can set up backup recovery options in your account settings.'
        },
        {
          q: 'Does PassVault support two-factor authentication?',
          a: 'Yes, we support multiple 2FA methods including authenticator apps, SMS, and biometric authentication.'
        }
      ]
    },
    {
      category: 'Billing',
      questions: [
        {
          q: 'Is there a free trial?',
          a: 'Yes, we offer a 30-day free trial with full access to all premium features. No credit card required.'
        },
        {
          q: 'Can I change my plan anytime?',
          a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
        },
        {
          q: 'Do you offer refunds?',
          a: 'Yes, we offer a 30-day money-back guarantee on all paid plans, no questions asked.'
        }
      ]
    }
  ];

  return (
    <div className="bg-[#F9F9F7] overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-6 border-b border-[#E5E5E0] pb-4">
            Page 4 | Questions & Answers
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            FREQUENTLY
            <br />
            ASKED
            <br />
            <span className="text-[#CC0000]">QUESTIONS</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12" style={{ fontFamily: "'Lora', serif" }}>
            Find answers to common questions about PassVault and how it works.
          </p>
        </div>
      </section>

      {/* FAQ CONTENT */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {faqs.map((section, sidx) => (
            <div key={sidx} className="mb-16">
              <div className="border-b-2 border-[#111111] mb-8 pb-6">
                <h2 className="text-4xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {section.category}
                </h2>
              </div>
              <div className="space-y-0 border-l border-t border-[#111111]">
                {section.questions.map((item, idx) => {
                  const globalIndex = faqs.slice(0, sidx).reduce((sum, s) => sum + s.questions.length, 0) + idx;
                  return (
                    <div key={idx} className="border-r border-b border-[#111111]">
                      <button
                        onClick={() => setActiveIndex(activeIndex === globalIndex ? null : globalIndex)}
                        className="w-full px-8 py-6 text-left hover:bg-[#E5E5E0] transition-colors flex justify-between items-start"
                      >
                        <h3 className="text-lg font-black flex-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {item.q}
                        </h3>
                        <ChevronDown
                          className={`h-5 w-5 text-[#111111] flex-shrink-0 ml-4 transition-transform ${
                            activeIndex === globalIndex ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {activeIndex === globalIndex && (
                        <div className="px-8 py-6 border-t border-[#E5E5E0] bg-[#F0F0F0]">
                          <p className="text-base leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            CAN'T FIND YOUR ANSWER?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ fontFamily: "'Lora', serif" }}>
            Contact our support team and we'll be happy to help.
          </p>
          <Link to="/contact" className="inline-block px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#FF3333]">
            CONTACT SUPPORT
          </Link>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default FAQ;
