import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Wallet } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location                = useLocation();
  const navigate                = useNavigate();
  const isAuthenticated         = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigation = [
    { name: 'FEATURES',    href: '/features' },
    { name: 'HOW IT WORKS',href: '/how-it-works' },
    { name: 'ABOUT',       href: '/about' },
    { name: 'PRICING',     href: '/pricing' },
    { name: 'FAQ',         href: '/faq' },
    { name: 'BLOG',        href: '/blog' },
    { name: 'CONTACT',     href: '/contact' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 bg-[#F9F9F7] transition-shadow duration-200 ${
        scrolled ? 'border-b-2 border-[#111111]' : 'border-b border-[#E5E5E0]'
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Edition meta strip */}
      <div className="border-b border-[#E5E5E0] hidden md:block">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-1.5">
          <span
            className="text-[0.6rem] uppercase tracking-[0.2em] text-[#737373]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Vol. I &nbsp;|&nbsp; {today} &nbsp;|&nbsp; Digital Security Edition
          </span>
          <span
            className="text-[0.6rem] uppercase tracking-[0.2em] text-[#737373]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Est. 2024 &nbsp;·&nbsp; Fast &amp; Secure
          </span>
        </div>
      </div>

      {/* Main nav bar */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-stretch h-16">

          {/* Logo */}
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-3 px-3 hover:bg-[#E5E5E0] transition-colors border-r border-[#E5E5E0]"
          >
            <div className="border border-[#111111] p-1.5 hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 group">
              <Wallet className="h-5 w-5 text-[#111111] group-hover:text-[#F9F9F7] transition-colors" />
            </div>
            <div className="flex flex-col items-start">
              <span
                className="text-base font-black text-[#111111] leading-none tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                PASSVAULT
              </span>
              <span
                className="text-[0.55rem] uppercase tracking-[0.2em] text-[#737373] leading-none mt-0.5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                FAST · SECURE
              </span>
            </div>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-stretch flex-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`px-3.5 text-[0.65rem] font-bold tracking-[0.15em] uppercase transition-all border-r border-[#E5E5E0] ${
                  location.pathname === item.href
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'text-[#111111] hover:bg-[#E5E5E0] hover:text-[#CC0000]'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-stretch border-l border-[#E5E5E0]">
            {isAuthenticated ? (
              <button
                onClick={() => handleNavClick('/dashboard')}
                className="px-5 text-[0.65rem] font-bold uppercase tracking-widest text-[#111111] border-r border-[#E5E5E0] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                DASHBOARD
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('/signin')}
                className="px-5 text-[0.65rem] font-bold uppercase tracking-widest text-[#111111] border-r border-[#E5E5E0] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                SIGN IN
              </button>
            )}
            <button
              onClick={() => handleNavClick('/download')}
              className="px-6 bg-[#CC0000] text-[#F9F9F7] text-[0.65rem] font-black uppercase tracking-widest hover:bg-[#990000] transition-colors"
            >
              DOWNLOAD
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex items-center justify-center px-4 border-l border-[#E5E5E0] hover:bg-[#E5E5E0] transition-colors min-w-[44px]"
            aria-label="Toggle menu"
          >
            {isOpen
              ? <X className="h-5 w-5 text-[#111111]" />
              : <Menu className="h-5 w-5 text-[#111111]" />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t-2 border-[#111111] bg-[#F9F9F7] animate-fade-in">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.href)}
              className={`w-full text-left px-6 py-4 text-xs font-bold tracking-widest uppercase border-b border-[#E5E5E0] transition-colors ${
                location.pathname === item.href
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            >
              {item.name}
            </button>
          ))}
          <div className="flex gap-0 border-t-2 border-[#111111]">
            {isAuthenticated ? (
              <button
                onClick={() => handleNavClick('/dashboard')}
                className="flex-1 py-4 border-r border-[#111111] text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                DASHBOARD
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('/signin')}
                className="flex-1 py-4 border-r border-[#111111] text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                SIGN IN
              </button>
            )}
            <button
              onClick={() => handleNavClick('/download')}
              className="flex-1 py-4 bg-[#CC0000] text-[#F9F9F7] text-xs font-black uppercase tracking-widest hover:bg-[#990000] transition-colors"
            >
              DOWNLOAD
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;