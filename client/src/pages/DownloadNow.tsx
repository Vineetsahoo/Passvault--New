import React from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const DownloadNow = () => {
  return (
    <div className="bg-[#F9F9F7] overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs uppercase tracking-widest font-mono text-[#525252] mb-6 border-b border-[#E5E5E0] pb-4">
            Get The App
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            DOWNLOAD
            <br />
            <span className="text-[#CC0000]">NOW</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12" style={{ fontFamily: "'Lora', serif" }}>
            Available on iOS, Android, Web, and Desktop. Sync everything seamlessly.
          </p>
        </div>
      </section>

      {/* DOWNLOAD OPTIONS */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-[#111111]">
            {[
              { platform: 'iOS', icon: '📱', url: '#' },
              { platform: 'Android', icon: '📱', url: '#' },
              { platform: 'Windows', icon: '🖥', url: '#' },
              { platform: 'MacOS', icon: '🍎', url: '#' }
            ].map((item) => (
              <div key={item.platform} className="border-r border-b border-[#111111] p-8 text-center hover:bg-[#E5E5E0] transition-colors">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {item.platform}
                </h3>
                <a
                  href={item.url}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors"
                >
                  <Download className="h-4 w-4" />
                  DOWNLOAD
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SYSTEM REQUIREMENTS */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-2 border-[#111111] mb-12 pb-8">
            <h2 className="text-4xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>SYSTEM REQUIREMENTS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border-2 border-[#111111] p-8">
              <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>iOS</h3>
              <p className="text-sm" style={{ fontFamily: "'Lora', serif" }}>iOS 14.0 or later</p>
            </div>
            <div className="border-2 border-[#111111] p-8">
              <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Android</h3>
              <p className="text-sm" style={{ fontFamily: "'Lora', serif" }}>Android 8.0 or later</p>
            </div>
            <div className="border-2 border-[#111111] p-8">
              <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Windows</h3>
              <p className="text-sm" style={{ fontFamily: "'Lora', serif" }}>Windows 10 or later</p>
            </div>
            <div className="border-2 border-[#111111] p-8">
              <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>MacOS</h3>
              <p className="text-sm" style={{ fontFamily: "'Lora', serif" }}>MacOS 10.15 or later</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default DownloadNow;
