import { Link, useLocation } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState, useEffect } from 'react';

const Header = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  const [isHidden, setIsHidden] = useState(false);
  const [isInHeroSection, setIsInHeroSection] = useState(isLandingPage);
  const [scrollOpacity, setScrollOpacity] = useState(isLandingPage ? 0 : 1);
  const { scrollY } = useScroll();
  const [lastScrollY, setLastScrollY] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Only apply hero section logic on landing page
    if (isLandingPage) {
      const heroHeight = window.innerHeight;
      
      // Determine if in hero section
      if (latest < heroHeight) {
        setIsInHeroSection(true);
        // Calculate opacity for smooth transition (0 at top, 1 at bottom of hero)
        const opacity = Math.min(latest / (heroHeight * 0.8), 1);
        setScrollOpacity(opacity);
      } else {
        setIsInHeroSection(false);
        setScrollOpacity(1);
      }
    }

    // Hide/show header based on scroll direction
    if (latest > lastScrollY && latest > 100) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }
    
    setLastScrollY(latest);
  });

  // Update states when route changes
  useEffect(() => {
    setIsInHeroSection(isLandingPage);
    setScrollOpacity(isLandingPage ? 0 : 1);
  }, [isLandingPage]);

  // Determine text and background colors
  const textColor = isInHeroSection 
    ? `rgba(255, 255, 255, ${1 - scrollOpacity})`
    : `rgba(9, 9, 11, ${scrollOpacity})`;
  
  const bgColor = isInHeroSection
    ? `rgba(255, 255, 255, 0)`
    : `rgba(255, 255, 255, ${scrollOpacity})`;

  const hoverColor = isInHeroSection ? 'rgb(216, 180, 254)' : 'rgb(113, 113, 122)';

  return (
    <motion.header
      initial={{ y: 0, opacity: 1 }}
      animate={{ 
        y: isHidden ? -100 : 0,
        opacity: isHidden ? 0 : 1 
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`fixed top-0 left-0 right-0 w-full px-6 lg:px-8 z-50 transition-all duration-300 ${isInHeroSection ? 'py-6' : 'py-3'}`}
      style={{
        backgroundColor: bgColor,
        boxShadow: scrollOpacity > 0.5 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="text-2xl font-bold tracking-tight"
            style={{ color: textColor }}
          >
            <span>DLM CASH®</span>
          </motion.div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-12 text-base font-medium">
          <Link 
            to="/features" 
            className="transition-colors duration-200"
            style={{ 
              color: textColor,
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = textColor}
          >
            FEATURES
          </Link>
          {isLandingPage ? (
            <a 
              href="#plans" 
              className="transition-colors duration-200"
              style={{ 
                color: textColor,
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = textColor}
            >
              PLANS
            </a>
          ) : (
            <Link 
              to="/#plans" 
              className="transition-colors duration-200"
              style={{ 
                color: textColor,
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = textColor}
            >
              PLANS
            </Link>
          )}
          <Link 
            to="/about" 
            className="transition-colors duration-200"
            style={{ 
              color: textColor,
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = textColor}
          >
            ABOUT
          </Link>
          <Link 
            to="/contact" 
            className="transition-colors duration-200"
            style={{ 
              color: textColor,
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = textColor}
          >
            CONTACT
          </Link>
        </nav>

        {/* Get Started Button */}
        <div className="flex items-center gap-6">
          <Link 
            to="/login" 
            className="hidden sm:block transition-colors duration-200 text-base font-medium"
            style={{ 
              color: textColor,
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = textColor}
          >
            Sign In
          </Link>
          <Link to="/signup">
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border-2 font-medium rounded-full transition-all duration-200 text-base hover:bg-white hover:!text-black hover:!border-white"
              style={{
                borderColor: textColor,
                color: textColor,
              }}
            >
              <span>→</span>
              <span>Get Started</span>
            </button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
