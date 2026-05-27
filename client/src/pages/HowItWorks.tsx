import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Shield, Share2, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Download the App',
      description: 'Get PassVault from App Store, Google Play, or our website.',
      icon: <Download className="h-8 w-8" />
    },
    {
      number: '02',
      title: 'Create Your Vault',
      description: 'Set a master password to protect all your passes and credentials.',
      icon: <Shield className="h-8 w-8" />
    },
    {
      number: '03',
      title: 'Scan or Upload',
      description: 'Use your camera to scan QR codes or upload passes manually.',
      icon: <QrCode className="h-8 w-8" />
    },
    {
      number: '04',
      title: 'Access Anywhere',
      description: 'Access your passes from any device with automatic synchronization.',
      icon: <Share2 className="h-8 w-8" />
    }
  ];

  return (
    <div className="bg-[#F9F9F7] overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-6 border-b border-[#E5E5E0] pb-4">
            Page 5 | Getting Started
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            HOW IT
            <br />
            <span className="text-[#CC0000]">WORKS</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12" style={{ fontFamily: "'Lora', serif" }}>
            Get started with PassVault in four simple steps.
          </p>
        </div>
      </section>

      {/* STEPS */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-t border-[#111111]">
            {steps.map((step, idx) => (
              <div key={idx} className="border-r border-b border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors">
                <div className="flex items-start gap-6">
                  <div className="border border-[#111111] w-16 h-16 flex items-center justify-center flex-shrink-0 hover:bg-[#111111] hover:text-[#F9F9F7] transition-all">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-2">STEP {step.number}</div>
                    <h3 className="text-2xl font-black mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED WALKTHROUGH */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-2 border-[#111111] mb-12 pb-8">
            <h2 className="text-5xl md:text-6xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
              DETAILED GUIDE
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                title: 'Installation',
                details: 'Download PassVault from your device\'s app store or visit our website. The installation takes less than 2 minutes.'
              },
              {
                title: 'Account Setup',
                details: 'Create your account with a strong master password. This password encrypts all your data locally before any transmission.'
              },
              {
                title: 'Import Your Passes',
                details: 'Add passes by scanning QR codes with your device camera or uploading files. Our intelligent parser handles multiple formats.'
              },
              {
                title: 'Organize & Secure',
                details: 'Categorize your passes, set expiration reminders, and enable two-factor authentication for maximum security.'
              }
            ].map((item, idx) => (
              <div key={idx} className="border-2 border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors">
                <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                  {item.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            READY TO GET STARTED?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ fontFamily: "'Lora', serif" }}>
            Download PassVault today and secure your digital passes.
          </p>
          <Link to="/download" className="inline-block px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#FF3333]">
            DOWNLOAD NOW
          </Link>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default HowItWorks;
