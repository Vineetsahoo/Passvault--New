import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollButtonProps {
  showThreshold?: number;
}

const ScrollButton: React.FC<ScrollButtonProps> = ({ showThreshold = 400 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showThreshold);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showThreshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="
        fixed bottom-8 right-8 z-50
        w-12 h-12
        bg-[#111111] text-[#F9F9F7]
        border border-[#111111]
        flex items-center justify-center
        hover:bg-[#CC0000] hover:border-[#CC0000]
        transition-all duration-200
        group
      "
      style={{
        boxShadow: '3px 3px 0px 0px rgba(204,0,0,0.35)',
      }}
    >
      {/* Hard shadow panel behind button (decorative) */}
      <ChevronUp
        className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5"
        strokeWidth={2.5}
      />
    </button>
  );
};

export default ScrollButton;
