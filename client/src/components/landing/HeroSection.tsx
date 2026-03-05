import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="w-full min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Video Background */}
      <div className="fixed inset-0 bg-black" style={{ zIndex: 0 }}>
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
            style={{
              minWidth: '100%',
              minHeight: '100%',
              transformOrigin: 'center center',
            }}
          >
            <source src="/assets/hero_bg.mp4" type="video/mp4" />
          </video>
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
        <div className="text-center">
          {/* Wave Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 sm:mb-8 flex justify-center"
            style={{ willChange: 'transform' }}
          >
            <svg 
              width="63" 
              height="63" 
              viewBox="0 0 63 63" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ opacity: 1 }}
              className="w-12 h-12 sm:w-16 sm:h-16"
            >
              <path 
                d="M10 31.5C15 25 20 38 25 31.5C30 25 35 38 40 31.5C45 25 50 38 55 31.5" 
                stroke="#d6b3ff" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-semibold text-white mb-4 sm:mb-6 px-4"
            style={{
              fontSize: 'clamp(48px, 10vw, 144px)',
              fontWeight: 600,
              letterSpacing: '-0.06em',
              lineHeight: '0.9em',
              textAlign: 'center',
            }}
          >
            <span className="block">DLM CASH</span>
            <span className="block mt-1 sm:mt-2">Investment</span>
          </motion.h1>

          

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mb-16 sm:mb-24 lg:mb-32"
          >
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300 text-base sm:text-lg font-semibold overflow-hidden relative"
                style={{
                  backgroundColor: '#d6b3ff',
                  color: '#000',
                  paddingLeft: '20px',
                  paddingRight: '28px',
                  willChange: 'transform',
                  cursor: 'pointer',
                }}
              >
                <span>→</span>
                <span>Get Started</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Bottom Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="flex flex-row items-center justify-center gap-8 sm:gap-16 lg:gap-32 text-white text-lg sm:text-xl lg:text-2xl max-w-6xl mx-auto px-4"
          >
            <div>
              <span className="font-semibold">Invest</span>
            </div>
            <div>
              <span className="font-semibold">Refer</span>
            </div>
            <div>
              <span className="font-semibold">Earn</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
    </section>
  );
};

export default HeroSection;
