import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { Wallet } from 'lucide-react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-[#111111] text-[#F9F9F7] border-t-4 border-[#CC0000] ${className}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="border-b-2 border-[#E5E5E0] pb-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="border border-[#F9F9F7] p-2">
                <Wallet className="h-6 w-6 text-[#F9F9F7]" />
              </div>
              <div>
                <div className="text-2xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                  PASSVAULT
                </div>
                <div className="text-xs uppercase tracking-widest font-mono text-[#A3A3A3]">
                  FAST | SECURE
                </div>
              </div>
            </div>

            {/* Edition Info */}
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest font-mono text-[#A3A3A3] mb-2">
                EDITION {currentYear}
              </div>
              <div className="text-sm" style={{ fontFamily: "'Lora', serif" }}>
                "All the Security That's Fit to Trust"
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-xs uppercase tracking-widest font-mono text-[#A3A3A3] mb-3">
                SUBSCRIBE FOR UPDATES
              </p>
              <form className="flex gap-0">
                <input
                  type="email"
                  placeholder="your email"
                  className="flex-1 bg-[#F9F9F7] text-[#111111] px-4 py-2 text-sm border border-[#111111] focus:outline-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <button className="bg-[#CC0000] text-[#F9F9F7] px-6 py-2 font-bold text-xs uppercase tracking-widest hover:bg-[#990000] transition-colors">
                  GO
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div className="border-r-2 border-[#E5E5E0] pr-8">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem' }}>
              ABOUT
            </h3>
            <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "'Lora', serif" }}>
              PassVault secures your digital life with military-grade encryption and trusted security practices.
            </p>
            <div className="flex gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="border border-[#F9F9F7] p-2 hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors">
                <FaGithub size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="border border-[#F9F9F7] p-2 hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors">
                <FaTwitter size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="border border-[#F9F9F7] p-2 hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors">
                <FaLinkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="border-r-2 border-[#E5E5E0] pr-8">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem' }}>
              LINKS
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'Features', path: '/features' },
                { name: 'Pricing', path: '/pricing' },
                { name: 'FAQ', path: '/faq' },
                { name: 'Blog', path: '/blog' },
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-sm hover:text-[#CC0000] transition-colors underline-offset-2 hover:underline">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="border-r-2 border-[#E5E5E0] pr-8">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem' }}>
              LEGAL
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'Privacy', path: '/privacy' },
                { name: 'Terms', path: '/terms' },
                { name: 'Security', path: '/' },
                { name: 'Compliance', path: '/' },
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-sm hover:text-[#CC0000] transition-colors underline-offset-2 hover:underline">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem' }}>
              CONTACT
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/contact'}
                className="w-full bg-[#CC0000] text-[#F9F9F7] px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-[#990000] transition-colors"
              >
                GET SUPPORT
              </button>
              <div className="border border-[#F9F9F7] p-3 bg-[#1a1a1a]">
                <div className="flex items-center gap-2 mb-2">
                  <FaEnvelope className="text-[#CC0000]" />
                  <span className="text-xs uppercase tracking-widest font-mono">Email</span>
                </div>
                <a href="mailto:support@passvault.com" className="text-sm hover:text-[#CC0000] transition-colors">
                  support@passvault.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t-2 border-[#E5E5E0] pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center md:text-left">
            <div className="text-xs font-mono tracking-widest text-[#A3A3A3]">
              © {currentYear} PASSVAULT. ALL RIGHTS RESERVED.
            </div>
            <div className="text-xs font-mono tracking-widest text-[#A3A3A3] md:text-right">
              CRAFTED BY THE PASSVAULT TEAM | PRINTED DIGITALLY
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;