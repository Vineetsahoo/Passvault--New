import React from "react";
import { Link } from "react-router-dom";
import { FaGithub, FaTwitter, FaLinkedin, FaEnvelope } from "react-icons/fa";
import { Wallet } from "lucide-react";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`bg-[#111111] text-[#F9F9F7] border-t-4 border-[#CC0000] ${className}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* ── HEADER ROW ──────────────────────────────────────────────── */}
        <div className="border-b border-[#404040] pb-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

            {/* Brand — 4 cols */}
            <div className="md:col-span-4 flex items-center gap-4">
              <div className="border border-[#F9F9F7] p-2 hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors">
                <Wallet className="h-5 w-5 text-[#F9F9F7]" />
              </div>
              <div>
                <div
                  className="text-xl font-black tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  PASSVAULT
                </div>
                <div
                  className="text-[0.55rem] uppercase tracking-[0.2em] text-[#737373]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  FAST · SECURE · TRUSTED
                </div>
              </div>
            </div>

            {/* Edition */}
            <div className="md:col-span-4 md:text-center">
              <div
                className="text-[0.55rem] uppercase tracking-[0.2em] text-[#737373] mb-1"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                EDITION {currentYear} · VOL. I
              </div>
              <div className="text-sm italic" style={{ fontFamily: "'Lora', serif" }}>
                "All the Security That's Fit to Trust"
              </div>
            </div>

            {/* Newsletter — 4 cols */}
            <div className="md:col-span-4">
              <p
                className="text-[0.55rem] uppercase tracking-[0.2em] text-[#737373] mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                SUBSCRIBE FOR UPDATES
              </p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="your email"
                  className="flex-1 bg-transparent border border-[#404040] text-[#F9F9F7] px-4 py-2.5 text-xs focus:outline-none focus:border-[#F9F9F7] transition-colors placeholder:text-[#737373]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <button className="bg-[#CC0000] text-[#F9F9F7] px-5 py-2.5 font-bold text-xs uppercase tracking-widest hover:bg-[#990000] transition-colors border border-[#CC0000]">
                  GO
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── CONTENT GRID ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 mb-10 border-l border-t border-[#404040]">
          {/* About — 4 cols */}
          <div className="md:col-span-4 border-r border-b border-[#404040] p-6">
            <h3
              className="text-[#CC0000] text-sm font-black uppercase tracking-widest mb-4"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}
            >
              ABOUT
            </h3>
            <p
              className="text-sm leading-relaxed text-[#A3A3A3] mb-6"
              style={{ fontFamily: "'Lora', serif" }}
            >
              PassVault secures your digital life with military-grade encryption
              and trusted security practices.
            </p>
            <div className="flex gap-2">
              {[
                { icon: FaGithub, label: "GitHub", href: "https://github.com/Vineetsahoo" },
                { icon: FaTwitter, label: "Twitter", href: "https://twitter.com" },
                { icon: FaLinkedin, label: "LinkedIn", href: "https://linkedin.com" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="border border-[#404040] h-11 w-11 flex items-center justify-center hover:bg-[#CC0000] hover:border-[#CC0000] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9F9F7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] rounded-none"
                  style={{ borderRadius: 0 }}
                >
                  <social.icon className="h-4 w-4 text-[#F9F9F7]" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links — 2 cols */}
          <div className="md:col-span-2 border-r border-b border-[#404040] p-6">
            <h3
              className="text-[#CC0000] text-sm font-black uppercase tracking-widest mb-4"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem' }}
            >
              LINKS
            </h3>
            <ul className="space-y-3" style={{ fontFamily: "'Lora', serif" }}>
              {[
                { name: 'Features', path: '/features' },
                { name: 'Pricing',  path: '/pricing' },
                { name: 'FAQ',      path: '/faq' },
                { name: 'Blog',     path: '/blog' },
              ].map(item => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-sm text-[#A3A3A3] hover:text-[#CC0000] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal — 2 cols */}
          <div className="md:col-span-2 border-r border-b border-[#404040] p-6">
            <h3
              className="text-[#CC0000] text-sm font-black uppercase tracking-widest mb-4"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem' }}
            >
              LEGAL
            </h3>
            <ul className="space-y-3" style={{ fontFamily: "'Lora', serif" }}>
              {[
                { name: 'Privacy',    path: '/privacy' },
                { name: 'Terms',      path: '/terms' },
                { name: 'Security',   path: '/features/secure-storage' },
                { name: 'Compliance', path: '/about' },
              ].map(item => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-sm text-[#A3A3A3] hover:text-[#CC0000] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — 4 cols */}
          <div className="md:col-span-4 border-r border-b border-[#404040] p-6">
            <h3
              className="text-[#CC0000] text-sm font-black uppercase tracking-widest mb-4"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}
            >
              CONTACT
            </h3>
            <Link
              to="/contact"
              className="block w-full text-center bg-[#CC0000] text-[#F9F9F7] px-4 py-3 font-bold text-xs uppercase tracking-widest hover:bg-[#990000] transition-colors mb-4"
            >
              GET SUPPORT
            </Link>
            <div className="border border-[#404040] p-4 bg-[#1a1a1a]">
              <div className="flex items-center gap-2 mb-2">
                <FaEnvelope className="text-[#CC0000]" size={14} />
                <span
                  className="text-[0.6rem] uppercase tracking-widest"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Email
                </span>
              </div>
              <a
                href="mailto:support@passvault.com"
                className="text-sm text-[#F9F9F7] hover:text-[#CC0000] transition-colors"
                style={{ fontFamily: "'Lora', serif" }}
              >
                support@passvault.com
              </a>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ──────────────────────────────────────────────── */}
        <div className="border-t border-[#404040] pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center md:text-left">
            <div
              className="text-[0.55rem] tracking-[0.15em] text-[#737373] uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              © {currentYear} PASSVAULT. ALL RIGHTS RESERVED.
            </div>
            <div
              className="text-[0.55rem] tracking-[0.15em] text-[#737373] uppercase md:text-right"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              EDITION: VOL. I &nbsp;·&nbsp; CRAFTED BY THE PASSVAULT TEAM &nbsp;·&nbsp; PRINTED DIGITALLY
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
