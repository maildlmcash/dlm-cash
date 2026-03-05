import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Header from './landing/Header';
import Footer from './landing/Footer';

const About = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity1 = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "₹50Cr+", label: "Total Invested" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" }
  ];

  const timeline = [
    {
      year: "2023",
      title: "Foundation",
      description: "DLM CASH was founded with a vision to democratize cryptocurrency investments for everyone."
    },
    {
      year: "2024",
      title: "Platform Launch",
      description: "Successfully launched our investment platform with multiple wallet types and referral system."
    },
    {
      year: "2025",
      title: "Expansion",
      description: "Reached 10,000+ active users and expanded our investment plans to meet diverse needs."
    },
    {
      year: "Future",
      title: "Innovation",
      description: "Continuing to build advanced features and expand globally with blockchain technology."
    }
  ];

  const values = [
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>,
      title: "Security First",
      description: "Your assets are protected with bank-grade encryption and blockchain transparency."
    },
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>,
      title: "Transparency",
      description: "All transactions are recorded on blockchain. No hidden fees, no surprises."
    },
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>,
      title: "Innovation",
      description: "We leverage cutting-edge technology to provide the best investment experience."
    },
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>,
      title: "Community",
      description: "Building a strong community of investors with our referral and reward programs."
    }
  ];

  return (
    <div className="min-h-screen bg-white" ref={containerRef}>
      <Header />
      
      {/* Hero Section */}
      <section className="w-full min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ opacity: opacity1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-white"></div>
        </motion.div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-start gap-3 mb-6 sm:mb-8" style={{ marginTop: '-8px' }}>
              <motion.svg 
                width="28" 
                height="28" 
                viewBox="0 0 63 63" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <path 
                  d="M10 31.5C15 25 20 38 25 31.5C30 25 35 38 40 31.5C45 25 50 38 55 31.5" 
                  stroke="#d6b3ff" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
              <motion.span 
                className="text-base sm:text-lg font-semibold tracking-wider whitespace-nowrap" 
                style={{ color: '#09090b' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                OUR STORY
              </motion.span>
            </div>

            <motion.h1 
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(64px, 12vw, 179px)',
                fontWeight: 600,
                letterSpacing: '-0.06em',
                lineHeight: '0.9em',
                color: '#09090b',
              }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Building the Future
              <br />
              <span style={{ color: '#09090b' }}>
                of Finance
              </span>
            </motion.h1>

            <motion.p 
              className="mt-8 max-w-3xl"
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(18px, 2.5vw, 24px)',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                lineHeight: '1.6em',
                color: '#71717a',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              At DLM CASH, we're revolutionizing cryptocurrency investments by making them accessible, secure, and profitable for everyone. Our mission is to empower individuals to achieve financial freedom through smart digital asset management.
            </motion.p>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    fontWeight: 700,
                    color: '#09090b',
                  }}
                  animate={{ 
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: index * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {stat.value}
                </motion.div>
                <div
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    fontWeight: 500,
                    color: '#71717a',
                    marginTop: '8px'
                  }}
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="w-full py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h2
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  lineHeight: '1.1em',
                  color: '#09090b',
                  marginBottom: '24px'
                }}
              >
                Our Mission
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 20px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                To democratize access to cryptocurrency investments and create a transparent, secure, and user-friendly platform where everyone can grow their wealth through digital assets. We believe in empowering our users with the tools, knowledge, and support they need to make informed investment decisions.
              </p>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-3xl p-12 relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute top-0 right-0 w-40 h-40 bg-purple-200 rounded-full blur-3xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <div className="relative z-10 mb-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(20px, 3vw, 28px)',
                    fontWeight: 600,
                    color: '#09090b',
                    marginBottom: '12px'
                  }}
                >
                  Innovation Driven
                </h3>
                <p
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(14px, 2vw, 16px)',
                    fontWeight: 500,
                    color: '#71717a',
                    lineHeight: '1.6em'
                  }}
                >
                  Leveraging blockchain technology and smart contracts to ensure transparency and security in every transaction.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="w-full py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: '1.1em',
                color: '#09090b',
              }}
            >
              Our Journey
            </h2>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <motion.div
              className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-300"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              style={{ transformOrigin: 'top' }}
            />

            {timeline.map((item, index) => (
              <motion.div
                key={index}
                className={`relative flex items-center mb-16 ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                  <motion.div
                    whileHover={{ scale: 1.05, x: index % 2 === 0 ? -10 : 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.h3
                      style={{
                        fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                        fontSize: 'clamp(24px, 3vw, 32px)',
                        fontWeight: 700,
                        color: '#09090b',
                        marginBottom: '8px'
                      }}
                      animate={{ 
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{
                        duration: 2,
                        delay: index * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {item.year}
                    </motion.h3>
                    <h4
                      style={{
                        fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                        fontSize: 'clamp(18px, 2.5vw, 24px)',
                        fontWeight: 600,
                        color: '#09090b',
                        marginBottom: '8px'
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      style={{
                        fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                        fontSize: 'clamp(14px, 2vw, 16px)',
                        fontWeight: 500,
                        color: '#71717a',
                        lineHeight: '1.6em'
                      }}
                    >
                      {item.description}
                    </p>
                  </motion.div>
                </div>

                {/* Center dot */}
                <motion.div
                  className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-black border-4 border-white shadow-lg z-10"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.2 + 0.3 }}
                  whileHover={{ scale: 1.5 }}
                />

                <div className="w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="w-full py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: '1.1em',
                color: '#09090b',
              }}
            >
              Our Core Values
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}
              >
                <div className="mb-4">
                  {value.icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(18px, 2.5vw, 22px)',
                    fontWeight: 600,
                    color: '#09090b',
                    marginBottom: '12px'
                  }}
                >
                  {value.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(14px, 2vw, 16px)',
                    fontWeight: 500,
                    color: '#71717a',
                    lineHeight: '1.6em'
                  }}
                >
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: '1.2em',
                color: '#09090b',
                marginBottom: '24px'
              }}
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Ready to Start Your Investment Journey?
            </motion.h2>
            <p
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(16px, 2vw, 20px)',
                fontWeight: 500,
                color: '#71717a',
                marginBottom: '32px',
                lineHeight: '1.6em'
              }}
            >
              Join thousands of investors who trust DLM CASH for their cryptocurrency investments.
            </p>
            <motion.button
              className="px-8 py-4 rounded-full text-white font-semibold"
              style={{
                background: '#09090b',
                fontSize: 'clamp(16px, 2vw, 18px)',
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{
                y: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              Get Started Today →
            </motion.button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
