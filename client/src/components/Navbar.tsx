import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Wallet, LogIn } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  const navigation = [
    { name: 'FEATURES', href: '/features' },
    { name: 'HOW IT WORKS', href: '/how-it-works' },
    { name: 'ABOUT', href: '/about' },
    { name: 'PRICING', href: '/pricing' },
    { name: 'FAQ', href: '/faq' },
    { name: 'BLOG', href: '/blog' },
    { name: 'CONTACT', href: '/contact' },
  ];

  const handleNavClick = (path: string): void => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 bg-[#F9F9F7] border-b-2 border-[#111111] font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group hover:bg-[#E5E5E0] px-3 py-2 transition-colors"
          >
            <div className="border border-[#111111] p-2">
              <Wallet className="h-6 w-6 text-[#111111]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
                PASSVAULT
              </span>
              <span className="text-[0.65rem] uppercase tracking-widest font-mono text-[#525252]">
                FAST | SECURE
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-0">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`px-4 py-2.5 text-xs font-bold tracking-widest uppercase transition-all border-r border-[#111111] ${
                  location.pathname === item.href
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'text-[#111111] hover:bg-[#E5E5E0]'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex md:items-center md:gap-0">
            {isAuthenticated ? (
              <button
                onClick={() => handleNavClick('/dashboard')}
                className="px-6 py-2.5 border border-[#111111] text-[#111111] font-bold uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('/signin')}
                className="px-6 py-2.5 border border-[#111111] text-[#111111] font-bold uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                SIGN IN
              </button>
            )}
            <button
              onClick={() => handleNavClick('/download')}
              className="px-6 py-2.5 bg-[#CC0000] text-[#F9F9F7] font-bold uppercase text-xs tracking-widest hover:bg-[#990000] transition-all"
            >
              DOWNLOAD
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 border border-[#111111] hover:bg-[#E5E5E0]"
          >
            {isOpen ? <X className="h-6 w-6 text-[#111111]" /> : <Menu className="h-6 w-6 text-[#111111]" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-[#111111] bg-[#F9F9F7]">
          <div className="px-4 py-4 space-y-0">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`w-full text-left px-4 py-3 text-xs font-bold tracking-widest uppercase border-b border-[#111111] transition-colors ${
                  location.pathname === item.href
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'text-[#111111] hover:bg-[#E5E5E0]'
                }`}
              >
                {item.name}
              </button>
            ))}
            <div className="pt-4 space-y-2 border-t border-[#111111]">
              {isAuthenticated ? (
                <button
                  onClick={() => handleNavClick('/dashboard')}
                  className="w-full px-4 py-3 border border-[#111111] text-[#111111] font-bold uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => handleNavClick('/signin')}
                  className="w-full px-4 py-3 border border-[#111111] text-[#111111] font-bold uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  SIGN IN
                </button>
              )}
              <button
                onClick={() => handleNavClick('/download')}
                className="w-full px-4 py-3 bg-[#CC0000] text-[#F9F9F7] font-bold uppercase text-xs tracking-widest hover:bg-[#990000] transition-all"
              >
                DOWNLOAD
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;