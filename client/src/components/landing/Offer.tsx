import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Offer = () => {
  const features = [
    {
      number: '01',
      title: 'Multiple Investment Plans',
      description: 'Choose from a variety of investment plans designed to maximize your returns with flexible options.',
      bgColor: '#f4f4f5',
    },
    {
      number: '02',
      title: 'Referral & Rewards',
      description: 'Build your network and earn through our multi-level referral program with attractive commissions.',
      bgColor: '#f4f4f5',
    },
    {
      number: '03',
      title: 'Secure & Transparent',
      description: 'Experience complete transparency with real-time tracking and secure blockchain-based transactions.',
      bgColor: '#f4f4f5',
    },
  ];

  return (
    <section className="w-full min-h-screen flex flex-col justify-start px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20 relative z-10 bg-white" style={{ overflow: 'hidden' }}>
      <div className="max-w-7xl mx-auto w-full" style={{ overflow: 'hidden' }}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12 sm:mb-16 flex flex-col lg:grid"
          style={{
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
          <div style={{ gridColumn: '1 / 3' }} className="mb-6 lg:mb-0">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <svg 
                width="24" 
                height="24" 
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
              <span className="text-sm font-semibold tracking-wider whitespace-nowrap" style={{ color: '#09090b' }}>
                WHAT WE OFFER
              </span>
            </div>

            <h2 
              className="lg:pl-5"
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(36px, 6vw, 88px)',
                fontWeight: 600,
                letterSpacing: '-0.06em',
                lineHeight: '0.9em',
                color: '#09090b',
                paddingLeft: window.innerWidth >= 1024 ? '20px' : '0',
              }}
            >
              What to expect
            </h2>
          </div>

          <div style={{ gridColumn: '3 / 5' }} className="flex items-start lg:items-center">
            <p 
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(16px, 2vw, 20px)',
                fontWeight: 500,
                letterSpacing: '-0.04em',
                lineHeight: '1.4em',
                color: '#71717a',
              }}
            >
              Join us for a comprehensive investment platform designed to maximize returns, build networks, and secure your financial future.
            </p>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-7 lg:gap-5"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="flex flex-col justify-between w-full lg:max-w-[280px] lg:mx-auto"
              style={{
                backgroundColor: feature.bgColor,
                minHeight: window.innerWidth >= 1024 ? '450px' : '400px',
                padding: window.innerWidth >= 1024 ? '32px' : '24px',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                willChange: 'transform',
              }}
            >
              <div>
                <span 
                  className="text-sm font-semibold mb-4 lg:mb-6 block"
                  style={{ color: '#d6b3ff' }}
                >
                  {feature.number}
                </span>
                <h3 
                  className="text-2xl sm:text-3xl font-semibold mb-4"
                  style={{ 
                    color: '#09090b',
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  }}
                >
                  {feature.title}
                </h3>
              </div>
              <p 
                className="text-base"
                style={{ 
                  color: '#71717a',
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  lineHeight: '1.5em',
                }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}

          {/* Dark CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="flex flex-col justify-between w-full lg:max-w-[280px] lg:mx-auto"
            style={{
              backgroundColor: '#09090b',
              minHeight: window.innerWidth >= 1024 ? '450px' : '400px',
              padding: window.innerWidth >= 1024 ? '32px' : '24px',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              willChange: 'transform',
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-6">
                <svg 
                  width="20" 
                  height="20" 
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
              </div>
              <h3 
                className="text-2xl sm:text-3xl font-semibold mb-4"
                style={{ 
                  color: '#fff',
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                }}
              >
                Want to get started?
              </h3>
            </div>
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 px-6 bg-white text-black font-semibold rounded-full flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                }}
              >
                <span>→</span>
                <span>Get started</span>
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Offer;
