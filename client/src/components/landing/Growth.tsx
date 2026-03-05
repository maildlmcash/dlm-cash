import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const Growth = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const stats = [
    { number: 100, label: 'ACTIVE USERS', icon: 'users' },
    { number: 50, label: 'INVESTMENTS', icon: 'chart' },
    { number: 100, label: 'SUCCESS RATE', icon: 'trending', suffix: '%' },
    { number: 24, label: 'SUPPORT', icon: 'shield', suffix: '/7' },
  ];

  return (
    <section className="w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16 sm:mb-20"
          style={{
            display: 'grid',
            gridTemplateRows: 'repeat(1, minmax(0, 1fr))',
            gridTemplateColumns: 'repeat(4, minmax(50px, 1fr))',
            gridAutoRows: 'minmax(0, 1fr)',
            justifyContent: 'center',
            gap: 0,
            width: '100%',
            height: 'min-content',
            padding: 0,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <div className="flex items-start gap-3 flex-shrink-0" style={{ gridColumn: '1 / 2', marginTop: '-8px' }}>
            <svg 
              width="28" 
              height="28" 
              viewBox="0 0 63 63" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M10 31.5C15 25 20 38 25 31.5C30 25 35 38 40 31.5C45 25 50 38 55 31.5" 
                stroke="#d6b3ff" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-base sm:text-lg font-semibold tracking-wider whitespace-nowrap" style={{ color: '#09090b' }}>
              ABOUT
            </span>
          </div>

          <h2 
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-normal leading-tight"
            style={{ 
              gridColumn: '2 / 5',
              fontFamily: 'Inter, "Inter Placeholder", sans-serif',
              fontSize: 'clamp(38px, 5vw, 64px)',
            }}
          >
            <span style={{ color: '#71717a' }}>Where </span>
            <span style={{ color: '#09090b' }}>investors, entrepreneurs, and visionaries </span>
            <span style={{ color: '#71717a' }}>come together to reimagine what </span>
            <span style={{ color: '#09090b' }}>financial growth </span>
            <span style={{ color: '#71717a' }}>looks like.</span>
          </h2>
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
          style={{
            display: 'grid',
            gridTemplateRows: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))',
            gridTemplateColumns: isMobile ? 'repeat(2, minmax(50px, 1fr))' : 'repeat(4, minmax(50px, 1fr))',
            gridAutoRows: 'minmax(0, 1fr)',
            justifyContent: 'center',
            gap: isMobile ? '2rem 1rem' : 0,
            width: '100%',
            height: 'min-content',
            padding: 0,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {stats.map((stat, index) => (
            <CountUpStat
              key={index}
              number={stat.number}
              label={stat.label}
              icon={stat.icon}
              suffix={stat.suffix}
              delay={index * 0.1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const StatIcon = ({ type }: { type: string }) => {
  const iconColor = '#d6b3ff';
  
  switch (type) {
    case 'users':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      );
    case 'chart':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10"></line>
          <line x1="18" y1="20" x2="18" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="16"></line>
        </svg>
      );
    case 'trending':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      );
    case 'shield':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
      );
    default:
      return null;
  }
};

const CountUpStat = ({ 
  number, 
  label, 
  icon, 
  suffix = '', 
  delay = 0 
}: { 
  number: number; 
  label: string; 
  icon: string; 
  suffix?: string; 
  delay?: number; 
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          setCount(0); // Reset count when visible
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`stat-${label}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [label]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = number / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= number) {
        setCount(number);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, number]);

  return (
    <motion.div
      id={`stat-${label}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="relative mb-3 sm:mb-4">
        <div
          className="font-semibold select-none"
          style={{
            color: '#09090b',
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: '0.9em',
            textAlign: 'center',
          }}
        >
          {count.toLocaleString()}{suffix}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <StatIcon type={icon} />
        <span 
          className="font-semibold tracking-wide" 
          style={{ 
            color: '#71717a',
            fontFamily: 'Inter, "Inter Placeholder", sans-serif',
            fontSize: 'clamp(12px, 2vw, 16px)',
          }}
        >
          {label}
        </span>
      </div>
    </motion.div>
  );
};

export default Growth;
