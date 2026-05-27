import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { 
  FaCalendar, FaUser, FaArrowLeft, FaArrowRight, 
  FaTags, FaSearch, FaBookmark, FaEye, FaArrowUp,
  FaFilter, FaChevronDown
} from 'react-icons/fa';
// Import Navbar and Footer
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';
import { useNavigate } from 'react-router-dom';

// Define blog post interface for better type safety
interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  tags: string[];
  category: string;
  featured?: boolean;
  readTime?: string;
}

const Blog = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const blogSectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Remove or modify the scroll tracking for animations to prevent blur
  // Instead of reducing opacity when scrolling, we'll keep it constant
  const { scrollY } = useScroll();

  // Check scroll position to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "Getting Started with PassVault",
      excerpt: "Learn how to maximize your digital security with our comprehensive guide.",
      image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=500&q=80",
      author: "Rahul Sharma",
      date: "2024-01-15",
      tags: ["Security", "Guide"],
      category: "guides",
      featured: true,
      readTime: "5 min"
    },
    {
      id: 2,
      title: "Best Practices for Password Management",
      excerpt: "Discover the essential practices for maintaining secure passwords across all your accounts.",
      image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=500&q=80",
      author: "Priya Patel",
      date: "2024-01-18",
      tags: ["Security", "Tips"],
      category: "security",
      readTime: "4 min"
    },
    {
      id: 3,
      title: "Understanding Two-Factor Authentication",
      excerpt: "Everything you need to know about 2FA and why it's crucial for your security.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&q=80",
      author: "Vikram Singh",
      date: "2024-01-20",
      tags: ["2FA", "Security"],
      category: "security",
      readTime: "6 min"
    },
    {
      id: 4,
      title: "PassVault 2.0: What's New",
      excerpt: "Explore the latest features and improvements in our newest release.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80",
      author: "Meera Kapoor",
      date: "2024-01-22",
      tags: ["Updates", "Features"],
      category: "updates",
      featured: true,
      readTime: "3 min"
    },
    {
      id: 5,
      title: "Securing Your Digital Identity",
      excerpt: "Essential tips for protecting your online presence in today's digital world.",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
      author: "Arjun Mehta",
      date: "2024-01-25",
      tags: ["Security", "Identity"],
      category: "security",
      readTime: "7 min"
    },
    {
      id: 6,
      title: "Password Manager for Teams",
      excerpt: "How PassVault helps businesses manage secure access across teams.",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&q=80",
      author: "Neha Gupta",
      date: "2024-01-28",
      tags: ["Teams", "Enterprise"],
      category: "guides",
      readTime: "5 min"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Posts', icon: <FaTags /> },
    { id: 'security', name: 'Security', icon: <FaTags /> },
    { id: 'guides', name: 'Guides', icon: <FaTags /> },
    { id: 'updates', name: 'Updates', icon: <FaTags /> }
  ];

  const filteredPosts = blogPosts
    .filter(post => 
      (selectedCategory === 'all' || post.category === selectedCategory) &&
      (post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const featuredPosts = blogPosts.filter(post => post.featured);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const blogCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');
          .font-serif  { font-family: 'Playfair Display', serif; }
          .font-body   { font-family: 'Lora', serif; }
          .font-sans   { font-family: 'Inter', sans-serif; }
          .font-mono   { font-family: 'JetBrains Mono', monospace; }
        `}</style>
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-8"
          style={{
            backgroundColor: '#F9F9F7',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
          }}
        >
          <div className="border-2 border-[#111111] p-12 flex flex-col items-center gap-6" style={{ borderRadius: 0 }}>
            <div className="w-12 h-12 border-t-2 border-[#111111] animate-spin" style={{ borderRadius: 0 }} />
            <p className="font-mono text-xs tracking-widest uppercase text-[#111111]">
              Loading Edition&hellip;
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');

        .font-serif  { font-family: 'Playfair Display', serif; }
        .font-body   { font-family: 'Lora', serif; }
        .font-sans   { font-family: 'Inter', sans-serif; }
        .font-mono   { font-family: 'JetBrains Mono', monospace; }

        * { border-radius: 0 !important; }

        .hard-shadow-hover {
          transition: box-shadow 0.2s ease-out, transform 0.2s ease-out;
        }
        .hard-shadow-hover:hover {
          box-shadow: 4px 4px 0px 0px #111111;
          transform: translate(-2px, -2px);
        }

        .newsprint-bg {
          background-color: #F9F9F7;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
        }

        .category-btn-active {
          background-color: #111111;
          color: #F9F9F7;
        }
        .category-btn-inactive {
          background-color: transparent;
          color: #111111;
          border: 1px solid #111111;
        }
        .category-btn-inactive:hover {
          background-color: #111111;
          color: #F9F9F7;
        }

        .blog-img {
          filter: grayscale(100%);
          transition: filter 0.3s ease-out;
        }
        .blog-img:hover, .group:hover .blog-img {
          filter: grayscale(0%) sepia(20%);
        }

        .search-input {
          background: transparent;
          border: none;
          border-bottom: 2px solid #111111;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
          color: #111111;
          outline: none;
          padding: 8px 4px 8px 36px;
          width: 100%;
          border-radius: 0 !important;
        }
        .search-input::placeholder { color: #737373; }
        .search-input:focus { background-color: #F0F0F0; }
      `}</style>

      {/* Navbar */}
      <Navbar />
      <div className="h-28" />

      {/* ── Page wrapper ── */}
      <div className="newsprint-bg min-h-screen font-body">

        {/* ── HERO ── */}
        <section className="border-b-4 border-[#111111]">
          <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-16">
            {/* Edition label */}
            <p className="font-mono text-xs tracking-widest uppercase text-[#737373] mb-4">
              PassVault Press &nbsp;|&nbsp; Security Intelligence
            </p>

            {/* Single thin rule */}
            <div className="border-t border-[#111111] mb-6" />

            {/* Giant headline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-8 border-r border-[#111111] pr-8">
                <h1
                  className="font-serif font-black leading-[0.9] tracking-tighter text-[#111111] mb-6"
                  style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}
                >
                  THE<br />
                  <span style={{ color: '#CC0000' }}>VAULT</span><br />
                  DISPATCH
                </h1>
                <p className="font-body text-lg text-[#525252] leading-relaxed max-w-2xl">
                  Insights, updates, and stories from the PassVault team to help you stay
                  secure in the digital world.
                </p>
              </div>

              <div className="lg:col-span-4 pl-8 flex flex-col justify-end">
                <div className="border-b border-[#E5E5E0] pb-4 mb-4">
                  <p className="font-mono text-xs tracking-widest uppercase text-[#737373]">In This Edition</p>
                </div>
                {featuredPosts.slice(0, 2).map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/blog/${p.id}`)}
                    className="text-left border-b border-[#E5E5E0] pb-3 mb-3 group"
                  >
                    <span className="font-mono text-xs text-[#CC0000] tracking-widest">
                      {String(i + 1).padStart(2, '0')} —&nbsp;
                    </span>
                    <span className="font-serif font-bold text-sm text-[#111111] group-hover:underline decoration-[#CC0000] decoration-2 underline-offset-2">
                      {p.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#111111] mt-8" />
          </div>
        </section>

        {/* ── FEATURED POSTS ── */}
        {featuredPosts.length > 0 && (
          <section className="border-b-4 border-[#111111]">
            <div className="max-w-screen-xl mx-auto px-4 py-12">
              {/* Section header */}
              <div className="flex items-center gap-4 mb-8">
                <span
                  className="font-mono text-xs tracking-widest uppercase px-3 py-1 text-[#F9F9F7]"
                  style={{ backgroundColor: '#CC0000' }}
                >
                  Featured
                </span>
                <span className="font-mono text-xs tracking-widest uppercase text-[#737373]">
                  Editor's Picks
                </span>
                <div className="flex-1 border-b border-[#111111]" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 border border-[#111111]">
                {featuredPosts.slice(0, 2).map((post, idx) => (
                  <motion.div
                    key={`featured-${post.id}`}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className={`group relative overflow-hidden cursor-pointer hard-shadow-hover ${idx === 0 ? 'border-r border-[#111111]' : ''}`}
                    style={{ height: '28rem' }}
                    onClick={() => navigate(`/blog/${post.id}`)}
                  >
                    {/* Image */}
                    <img
                      src={post.image}
                      alt={post.title}
                      className="blog-img w-full h-full object-cover absolute inset-0"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                    {/* Top meta bar */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 bg-black/60">
                      <div className="flex items-center gap-3">
                        <span
                          className="font-mono text-xs tracking-widest uppercase px-2 py-0.5 text-[#F9F9F7]"
                          style={{ backgroundColor: '#CC0000' }}
                        >
                          Featured
                        </span>
                        <span className="font-mono text-xs tracking-widest uppercase text-white/70">
                          {post.category}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-white/60 flex items-center gap-1">
                        <FaEye className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>

                    {/* Bottom content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                      <p className="font-mono text-xs tracking-widest uppercase text-white/50 mb-2">
                        <FaCalendar className="inline mr-1" />
                        {new Date(post.date).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })}
                      </p>

                      <h3 className="font-serif font-black text-2xl lg:text-3xl text-white leading-tight mb-3 group-hover:text-[#CC0000] transition-colors duration-200">
                        {post.title}
                      </h3>

                      <p className="font-body text-white/70 text-sm line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between border-t border-white/20 pt-4">
                        <span className="font-mono text-xs tracking-widest text-white/60 uppercase">
                          By {post.author}
                        </span>
                        <span className="font-mono text-xs tracking-widest uppercase border border-white/40 px-3 py-1.5 text-white/80 group-hover:bg-white group-hover:text-[#111111] transition-all duration-200 flex items-center gap-2">
                          Read Article <FaArrowRight />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SEARCH + FILTER ── */}
        <section className="border-b border-[#111111] sticky top-0 z-40" style={{ backgroundColor: '#F9F9F7' }}>
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-0">

              {/* Search */}
              <div className="relative flex-1 border-r border-[#111111]">
                <FaSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373]"
                  style={{ width: 13, height: 13 }}
                />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input py-5"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              {/* Desktop Category Buttons */}
              <div className="hidden md:flex">
                {categories.map((cat, i) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`font-mono text-xs tracking-widest uppercase px-5 py-5 transition-all duration-200 ${i < categories.length - 1 ? 'border-r border-[#111111]' : ''} ${selectedCategory === cat.id ? 'category-btn-active' : 'category-btn-inactive'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Mobile Filter Dropdown */}
              <div className="md:hidden border-t border-[#111111]">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="w-full flex items-center justify-between px-4 py-4 font-mono text-xs tracking-widest uppercase text-[#111111]"
                >
                  <div className="flex items-center gap-2">
                    <FaFilter />
                    <span>Filter: {categories.find(c => c.id === selectedCategory)?.name}</span>
                  </div>
                  <FaChevronDown className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-[#111111] overflow-hidden"
                    >
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => { setSelectedCategory(cat.id); setIsFilterOpen(false); }}
                          className={`w-full px-4 py-3 text-left font-mono text-xs tracking-widest uppercase border-b border-[#E5E5E0] transition-colors duration-200 ${selectedCategory === cat.id ? 'bg-[#111111] text-[#F9F9F7]' : 'text-[#111111] hover:bg-[#E5E5E0]'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ── BLOG GRID ── */}
        <section className="border-b-4 border-[#111111]">
          <div className="max-w-screen-xl mx-auto px-4 py-12">

            {/* Results label */}
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-xs tracking-widest uppercase text-[#737373]">
                {filteredPosts.length} Article{filteredPosts.length !== 1 ? 's' : ''} Found
              </span>
              <div className="flex-1 border-b border-[#E5E5E0]" />
              <span className="font-mono text-xs tracking-widest uppercase text-[#737373]">
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              </span>
            </div>

            {/* Grid */}
            <motion.div
              ref={blogSectionRef}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-[#111111]"
            >
              <AnimatePresence>
                {filteredPosts.map((post) => (
                  <motion.article
                    key={post.id}
                    variants={blogCardVariants}
                    initial="hidden"
                    animate="visible"
                    layoutId={`post-${post.id}`}
                    className="group border-r border-b border-[#111111] flex flex-col cursor-pointer hard-shadow-hover"
                    onClick={() => navigate(`/blog/${post.id}`)}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden" style={{ height: '13rem' }}>
                      <img
                        src={post.image}
                        alt={`Blog Post ${post.id}`}
                        className="blog-img w-full h-full object-cover"
                      />
                      {/* Category badge */}
                      <span
                        className="absolute top-0 left-0 font-mono text-xs tracking-widest uppercase px-3 py-1.5 text-[#F9F9F7]"
                        style={{ backgroundColor: '#111111' }}
                      >
                        {post.category}
                      </span>
                      {/* Read time */}
                      <span className="absolute bottom-0 right-0 font-mono text-xs tracking-widest uppercase px-3 py-1.5 text-[#F9F9F7] flex items-center gap-1" style={{ backgroundColor: '#111111' }}>
                        <FaEye className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1 border-t border-[#111111]">
                      {/* Meta */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-xs tracking-widest uppercase text-[#737373] flex items-center gap-1.5">
                          <FaCalendar className="w-3 h-3" />
                          {new Date(post.date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                        <span className="font-mono text-xs tracking-widest uppercase text-[#737373]">
                          {post.author}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="font-serif font-bold text-xl lg:text-2xl text-[#111111] leading-tight mb-3 group-hover:text-[#CC0000] transition-colors duration-200">
                        {post.title}
                      </h2>

                      <p className="font-body text-sm text-[#525252] leading-relaxed line-clamp-3 flex-1 text-justify mb-4">
                        {post.excerpt}
                      </p>

                      {/* Tags + CTA */}
                      <div className="mt-auto pt-4 border-t border-[#E5E5E0]">
                        <div className="flex items-center flex-wrap gap-2 mb-4">
                          {post.tags.map(tag => (
                            <span
                              key={tag}
                              className="font-mono text-xs tracking-widest uppercase border border-[#111111] px-2 py-0.5 text-[#111111]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <span className="font-mono text-xs tracking-widest uppercase text-[#111111] flex items-center gap-2 group-hover:text-[#CC0000] transition-colors duration-200">
                          Read Article <FaArrowRight />
                        </span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Empty state */}
            {filteredPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-[#111111] p-16 text-center"
              >
                <div
                  className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border-2 border-[#111111]"
                >
                  <FaSearch className="w-6 h-6 text-[#737373]" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-[#111111] mb-2">
                  No Articles Found
                </h3>
                <p className="font-body text-sm text-[#737373] mb-8">
                  Try adjusting your search or category filter.
                </p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                  className="font-mono text-xs tracking-widest uppercase border-2 border-[#111111] px-6 py-3 text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                >
                  Reset Filters
                </button>
              </motion.div>
            )}

            {/* ── PAGINATION ── */}
            <div className="mt-12 flex items-center justify-between border border-[#111111]">
              <button
                className="font-mono text-xs tracking-widest uppercase px-6 py-4 border-r border-[#111111] flex items-center gap-2 text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                <FaArrowLeft /> Previous
              </button>

              <div className="flex items-center">
                {[1, 2, 3].map((page, i) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`font-mono text-xs tracking-widest w-12 h-12 flex items-center justify-center transition-all duration-200 ${i < 2 ? 'border-r border-[#111111]' : ''} ${currentPage === page ? 'bg-[#111111] text-[#F9F9F7]' : 'text-[#111111] hover:bg-[#E5E5E0]'}`}
                  >
                    {String(page).padStart(2, '0')}
                  </button>
                ))}
              </div>

              <button
                className="font-mono text-xs tracking-widest uppercase px-6 py-4 border-l border-[#111111] flex items-center gap-2 text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next <FaArrowRight />
              </button>
            </div>
          </div>
        </section>

        {/* ── NEWSLETTER STRIP ── */}
        <section className="bg-[#111111] border-b-4" style={{ borderColor: '#CC0000' }}>
          <div className="max-w-screen-xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-[#737373] mb-2">
                Stay Informed
              </p>
              <h2 className="font-serif font-black text-3xl lg:text-4xl text-[#F9F9F7] leading-tight">
                Subscribe to the<br />
                <span style={{ color: '#CC0000' }}>Vault Dispatch</span>
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-0 border border-[#F9F9F7] w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="font-mono text-sm bg-transparent text-[#F9F9F7] px-5 py-4 outline-none flex-1 border-b sm:border-b-0 sm:border-r border-[#F9F9F7] placeholder:text-[#737373]"
                style={{ borderRadius: 0 }}
              />
              <button
                className="font-mono text-xs tracking-widest uppercase px-6 py-4 text-[#111111] transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: '#CC0000', color: '#F9F9F7' }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Scroll to top button ── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 w-12 h-12 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] flex items-center justify-center hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 z-50"
            style={{ borderRadius: 0 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <FaArrowUp />
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
      <ScrollButton />
    </>
  );
};

export default Blog;