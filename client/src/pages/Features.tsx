import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cloud, Lock, TrendingUp, Users, Smartphone } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Features = () => {
  const features = [
    {
      title: 'Secure Storage',
      icon: <Shield className="h-8 w-8" />,
      description: 'Military-grade encryption for all your passwords and digital passes'
    },
    {
      title: 'Multi-Device Sync',
      icon: <Cloud className="h-8 w-8" />,
      description: 'Seamless synchronization across all your devices in real-time'
    },
    {
      title: 'Advanced Security',
      icon: <Lock className="h-8 w-8" />,
      description: 'Two-factor authentication and biometric security options'
    },
    {
      title: 'Smart Analytics',
      icon: <TrendingUp className="h-8 w-8" />,
      description: 'Track your pass usage and security health at a glance'
    },
    {
      title: 'Secure Sharing',
      icon: <Users className="h-8 w-8" />,
      description: 'Share passes securely with family and team members'
    },
    {
      title: 'Mobile First',
      icon: <Smartphone className="h-8 w-8" />,
      description: 'Native apps for iOS and Android with full feature parity'
    }
  ];

  return (
    <div className="bg-[#F9F9F7] overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-6 border-b border-[#E5E5E0] pb-4">
            Page 2 | Feature Showcase
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            POWERFUL
            <br />
            FEATURES
            <br />
            <span className="text-[#CC0000]">INCLUDED</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12" style={{ fontFamily: "'Lora', serif" }}>
            Everything you need to secure and organize your digital passes in one elegant platform.
          </p>
          <Link to="/download" className="inline-block px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000]">
            GET STARTED
          </Link>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-[#111111]">
            {features.map((feature, idx) => (
              <div key={idx} className="border-r border-b border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors">
                <div className="border border-[#111111] w-16 h-16 flex items-center justify-center mb-6 hover:bg-[#111111] hover:text-[#F9F9F7] transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED FEATURES */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-2 border-[#111111] mb-12 pb-8">
            <h2 className="text-5xl md:text-7xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
              SECURITY FEATURES
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              { title: 'End-to-End Encryption', description: 'Your data is encrypted on your device before it leaves.' },
              { title: 'Zero-Knowledge Architecture', description: 'We cannot access your data, only you can.' },
              { title: 'Biometric Authentication', description: 'Unlock with fingerprint or face recognition.' },
              { title: 'Security Audits', description: 'Regular third-party security audits and penetration testing.' }
            ].map((item, idx) => (
              <div key={idx} className="border-2 border-[#111111] p-8">
                <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            READY TO SECURE YOUR PASSES?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ fontFamily: "'Lora', serif" }}>
            Join thousands of users who trust PassVault with their sensitive data.
          </p>
          <Link to="/download" className="inline-block px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000]">
            DOWNLOAD NOW
          </Link>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default Features;
