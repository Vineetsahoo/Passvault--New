import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScrollButtonProps {
  showThreshold?: number;
}

const ScrollButton: React.FC<ScrollButtonProps> = ({ showThreshold = 300 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollableHeight = docHeight - windowHeight;
      const scrollPercentage = (scrollTop / scrollableHeight) * 100;

      // Show button when scrolled down more than threshold
      setIsVisible(scrollTop > showThreshold);

      // Determine scroll direction and position
      if (scrollTop < showThreshold) {
        setIsAtTop(true);
        setIsAtBottom(false);
        setScrollDirection('down');
      } else if (scrollPercentage > 90) {
        setIsAtTop(false);
        setIsAtBottom(true);
        setScrollDirection('up');
      } else {
        setIsAtTop(false);
        setIsAtBottom(false);
        // Keep previous direction
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showThreshold]);

  const scrollToPosition = () => {
    if (scrollDirection === 'up') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30
          }}
          onClick={scrollToPosition}
          className="fixed bottom-8 right-8 z-40 group"
          aria-label={scrollDirection === 'up' ? 'Scroll to top' : 'Scroll to bottom'}
        >
          {/* Main Button */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            {/* Background glow effect */}
            <motion.div
              animate={{
                boxShadow: isAtTop || isAtBottom 
                  ? '0 0 20px rgba(99, 102, 241, 0.6)' 
                  : '0 0 15px rgba(99, 102, 241, 0.4)'
              }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"
            />

            {/* Main button container */}
            <motion.div
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg flex items-center justify-center cursor-pointer overflow-hidden group"
            >
              {/* Animated background shimmer on hover */}
              <motion.div
                initial={{ opacity: 0, x: '-100%' }}
                whileHover={{ opacity: 1, x: '100%' }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              />

              {/* Icon container with animation */}
              <motion.div
                key={scrollDirection}
                initial={{ opacity: 0, y: scrollDirection === 'up' ? 20 : -20, rotate: scrollDirection === 'up' ? 180 : 0 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: scrollDirection === 'up' ? -20 : 20, rotate: scrollDirection === 'up' ? -180 : 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20
                }}
                className="relative z-10"
              >
                {scrollDirection === 'up' ? (
                  <ChevronUp className="w-6 h-6 text-white" strokeWidth={3} />
                ) : (
                  <ChevronDown className="w-6 h-6 text-white" strokeWidth={3} />
                )}
              </motion.div>

              {/* Hover ring effect */}
              <motion.div
                whileHover={{ scale: 1.15 }}
                className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/60 transition-colors duration-300"
              />
            </motion.div>
          </motion.div>

          {/* Tooltip on hover */}
          <motion.div
            initial={{ opacity: 0, y: 10, x: 10 }}
            whileHover={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none"
          >
            {scrollDirection === 'up' ? 'Scroll to Top' : 'Scroll to Bottom'}
            <div className="absolute top-full right-3 w-2 h-2 bg-gray-900 transform rotate-45" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollButton;
