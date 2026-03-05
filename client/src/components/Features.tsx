import { motion } from 'framer-motion';
import { useRef } from 'react';
import Header from './landing/Header';
import Footer from './landing/Footer';

const Features = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>,
      title: "Multiple Investment Plans",
      description: "Choose from a variety of investment plans tailored to your financial goals and risk appetite."
    },
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>,
      title: "Multi-Wallet System",
      description: "Manage your funds efficiently with our comprehensive wallet infrastructure."
    },
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>,
      title: "Referral Program",
      description: "Earn generous commissions by inviting friends and family to join DLM CASH."
    },
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>,
      title: "Fast Withdrawals",
      description: "Quick and hassle-free withdrawal process with multiple payment options."
    },
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>,
      title: "Blockchain Security",
      description: "All transactions recorded on blockchain for complete transparency and security."
    },
    {
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>,
      title: "User Dashboard",
      description: "Intuitive interface designed for both beginners and experienced investors."
    }
  ];

  return (
    <div className="min-h-screen bg-white" ref={containerRef}>
      <Header />
      
      {/* Hero Section */}
      <section className="w-full min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36">
        <div className="max-w-7xl mx-auto w-full">
          {/* Large Features Title */}
          <div className="mb-20">
            <h1 
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(80px, 15vw, 180px)',
                fontWeight: 700,
                letterSpacing: '-0.05em',
                lineHeight: '0.9em',
                color: '#09090b',
              }}
            >
              Features
            </h1>
          </div>

          <div className="flex items-start justify-between gap-8 mb-16">
            {/* Left: Label */}
            <div className="flex items-start gap-3">
              <svg 
                width="28" 
                height="28" 
                viewBox="0 0 63 63" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M10 31.5C15 25 20 38 25 31.5C30 25 35 38 40 31.5C45 25 50 38 55 31.5" 
                  stroke="#09090b" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span 
                className="text-base sm:text-lg font-semibold tracking-wider whitespace-nowrap uppercase" 
                style={{ color: '#09090b' }}
              >
                FEATURES
              </span>
            </div>

            {/* Right: Get in touch link */}
            <a 
              href="/contact"
              className="flex items-center gap-2 text-base font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#09090b' }}
            >
              <span>→</span>
              <span>Get in touch</span>
            </a>
          </div>

          {/* Center: Main heading */}
          <div className="text-center mb-20">
            <h2
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(32px, 5vw, 64px)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: '1.2em',
                maxWidth: '900px',
                margin: '0 auto'
              }}
            >
              <span style={{ color: '#09090b' }}>Our </span>
              <span style={{ color: '#71717a' }}>powerful features</span>
              <span style={{ color: '#09090b' }}> make crypto investing </span>
              <span style={{ color: '#71717a' }}>accessible and secure</span>
              <span style={{ color: '#09090b' }}> for everyone.</span>
            </h2>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 hover:bg-gray-100 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(20px, 2.5vw, 24px)',
                    fontWeight: 600,
                    color: '#09090b',
                    marginBottom: '12px'
                  }}
                >
                  {feature.title}
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
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            style={{
              fontFamily: 'Inter, "Inter Placeholder", sans-serif',
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: '1.2em',
              color: '#09090b',
              marginBottom: '24px'
            }}
          >
            Ready to Start Investing?
          </h2>
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
          <button
            className="px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              fontFamily: 'Inter, "Inter Placeholder", sans-serif',
            }}
          >
            Get Started Today →
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
