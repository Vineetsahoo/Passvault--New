import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react'; // Make sure to import ChevronDown

interface ScrollButtonProps {
  showThreshold?: number;
}

const ScrollButton: React.FC<ScrollButtonProps> = ({ showThreshold = 400 }) => {
  // We'll track if the user has scrolled past the threshold
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledDown(window.scrollY > showThreshold);
    };
    
    // Run once on mount to catch if the page is already scrolled on reload
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showThreshold]);

  const handleScrollAction = () => {
    if (isScrolledDown) {
      // If we are scrolled down, go back to the top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // If we are at the top, go to the bottom of the page
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={handleScrollAction}
      aria-label={isScrolledDown ? "Scroll to top" : "Scroll to bottom"}
      className="
        fixed bottom-8 right-8 z-50
        w-12 h-12
        bg-[#111111] text-[#F9F9F7]
        border border-[#111111]
        flex items-center justify-center
        hover:bg-[#CC0000] hover:border-[#CC0000]
        transition-all duration-200
        group
        sharp-corners
      "
      style={{
        boxShadow: '3px 3px 0px 0px rgba(204,0,0,0.35)',
        borderRadius: 0,
      }}
    >
      {isScrolledDown ? (
        <ChevronUp
          className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5"
          strokeWidth={2.5}
        />
      ) : (
        <ChevronDown
          className="h-5 w-5 transition-transform duration-200 group-hover:translate-y-0.5"
          strokeWidth={2.5}
        />
      )}
    </button>
  );
};

export default ScrollButton;