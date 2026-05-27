import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, QrCode, Clock, RefreshCw, Users, Check, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Home = () => {
  const features = [
    { icon: <Shield className="h-6 w-6" />, title: 'Secure Storage', description: 'Military-grade encryption for your peace of mind.' },
    { icon: <Smartphone className="h-6 w-6" />, title: 'Multi-Device', description: 'Access passes across all your devices seamlessly.' },
    { icon: <QrCode className="h-6 w-6" />, title: 'QR Scanning', description: 'Instant pass capture using your camera.' },
    { icon: <Clock className="h-6 w-6" />, title: 'Smart Alerts', description: 'Never miss an expiration date.' },
    { icon: <RefreshCw className="h-6 w-6" />, title: 'Auto-Sync', description: 'Changes propagate instantly.' },
    { icon: <Users className="h-6 w-6" />, title: 'Share Safely', description: 'Secure sharing with loved ones.' },
  ];

  return (
    <div className="bg-[#F9F9F7] overflow-hidden">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-6 border-b border-[#E5E5E0] pb-4">
                Vol. 1 | Edition 2026 | Secure Edition
              </div>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                MASTER
                <br />
                YOUR
                <br />
                <span className="text-[#CC0000]">PASS</span>
                <br />
                VAULT
              </h1>
              <p className="text-lg md:text-xl mb-8 max-w-md" style={{ fontFamily: "'Lora', serif" }}>
                Military-grade encryption meets elegant simplicity. Your digital passes, perfectly organized and always secure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/download" className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors">
                  DOWNLOAD NOW
                </Link>
                <Link to="/how-it-works" className="px-8 py-4 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors">
                  EXPLORE
                </Link>
              </div>
              <div className="border-t border-[#E5E5E0] pt-6">
                <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-4">Featured In</div>
                <div className="flex gap-6 text-xs uppercase tracking-widest font-bold text-[#111111]">
                  <div>Tech Weekly</div>
                  <div>Security Daily</div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-4 border-[#111111] aspect-square bg-[#F0F0F0] flex items-center justify-center overflow-hidden">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="PassVault" className="w-full h-full object-cover filter grayscale hover:grayscale-[50%] transition-all" loading="lazy" />
              </div>
              <div className="mt-6 border border-[#111111] p-6 bg-white">
                <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-2">Security Level</div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-3 flex-1 bg-[#111111]"></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-2 border-[#111111] mb-12 pb-8">
            <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-4">Core Features</div>
            <h2 className="text-5xl md:text-7xl font-black leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              EVERYTHING YOU NEED
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-t border-[#111111]">
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

      {/* TESTIMONIALS */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-2 border-[#111111] mb-12 pb-8">
            <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-4">What Users Say</div>
            <h2 className="text-5xl md:text-7xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>FROM OUR READERS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-t border-[#111111]">
            {[
              { quote: "PassVault transformed how I manage my digital passes. Clean interface, unmatched security.", author: "Priya Sharma", role: "Business Owner" },
              { quote: "Auto-sync across devices works flawlessly. No more lost passes.", author: "Rahul Verma", role: "Software Engineer" },
              { quote: "QR code scanning saves hours weekly. Highly recommended.", author: "Ananya Patel", role: "Student" },
              { quote: "Finally, a solution that puts security and simplicity first.", author: "Vikram Singh", role: "Entrepreneur" },
            ].map((test, idx) => (
              <div key={idx} className="border-r border-b border-[#111111] p-8 hover:bg-[#E5E5E0] transition-colors">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-[#CC0000] text-[#CC0000]" />)}
                </div>
                <p className="text-lg mb-6 font-serif italic leading-relaxed">"{test.quote}"</p>
                <div className="border-t border-[#E5E5E0] pt-4">
                  <div className="font-black text-sm">{test.author}</div>
                  <div className="text-xs uppercase tracking-widest text-[#525252] font-mono flex items-center gap-2">
                    {test.role} <Check className="h-3 w-3 text-[#CC0000]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INVERTED CTA */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs uppercase tracking-widest font-mono text-[#A3A3A3] mb-6 border-b border-[#404040] pb-4">
                Ready to Start
              </div>
              <h2 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                JOIN
                <br />
                THOUSANDS
              </h2>
              <p className="text-lg md:text-xl mb-8" style={{ fontFamily: "'Lora', serif" }}>
                Begin your journey to a more organized digital life. No credit card required.
              </p>
              <div className="space-y-4 mb-8">
                {['Military-grade encryption', 'Zero-knowledge architecture', '30-day free trial', 'Cancel anytime'].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <Check className="h-6 w-6 text-[#CC0000]" />
                    <span className="text-lg font-serif">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link to="/download" className="inline-block px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#FF3333] transition-colors">
                GET STARTED FREE
              </Link>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-0 border-l border-t border-[#F9F9F7]">
                {[
                  { number: '50K+', label: 'Active Users' },
                  { number: '10M+', label: 'Passes Stored' },
                  { number: '99.9%', label: 'Uptime' },
                  { number: '0', label: 'Security Breaches' },
                ].map((stat, idx) => (
                  <div key={idx} className="border-r border-b border-[#F9F9F7] p-8 hover:bg-[#1a1a1a] transition-colors">
                    <div className="text-4xl md:text-5xl font-black text-[#CC0000] mb-2">{stat.number}</div>
                    <div className="text-xs uppercase tracking-widest font-mono text-[#A3A3A3]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="border border-[#111111] p-12 text-center">
            <p className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-4">Final Call to Action</p>
            <h2 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              DON'T WAIT ANY LONGER
            </h2>
            <p className="text-lg max-w-2xl mx-auto mb-8" style={{ fontFamily: "'Lora', serif" }}>
              Your digital security is too important. Start protecting your passes today.
            </p>
            <Link to="/download" className="inline-block px-12 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-sm tracking-widest hover:bg-[#990000] transition-colors">
              DOWNLOAD NOW
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default Home;
