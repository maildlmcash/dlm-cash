import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I get started with DLM CASH?',
      answer: 'Getting started is easy! Simply sign up for an account, complete your KYC verification, choose an investment plan, and start earning returns immediately.'
    },
    {
      question: 'What are the minimum investment requirements?',
      answer: 'Our platform offers flexible investment options starting from as low as ₹1000, making it accessible for everyone to begin their investment journey.'
    },
    {
      question: 'How does the referral program work?',
      answer: 'Share your unique referral link with friends and family. You will earn multi-level commissions when they join and invest, helping you build passive income.'
    },
    {
      question: 'What makes DLM CASH secure and transparent?',
      answer: 'We use blockchain technology for transparent transactions, secure wallet systems, real-time tracking, and comprehensive KYC verification to ensure platform security.'
    },
    {
      question: 'How can I withdraw my earnings?',
      answer: 'You can request withdrawals directly from your wallet dashboard. Funds are processed within 24-48 hours and transferred to your registered bank account or crypto wallet.'
    },
    {
      question: 'What are the different wallet types available?',
      answer: 'DLM CASH provides INR Wallet, USDT Wallet, ROI Wallet for investment returns, Salary Wallet for referral earnings, and Breakdown Wallet for your investment structure.'
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
          <div style={{ gridColumn: '1 / 2' }} className="mb-6 lg:mb-0">
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
                FAQ
              </span>
            </div>

            <h2 
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(48px, 6vw, 88px)',
                fontWeight: 600,
                letterSpacing: '-0.06em',
                lineHeight: '0.9em',
                color: '#09090b',
              }}
            >
              FAQ
            </h2>

            <p 
              className="mt-6"
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(16px, 2vw, 20px)',
                fontWeight: 500,
                letterSpacing: '-0.04em',
                lineHeight: '1.4em',
                color: '#71717a',
              }}
            >
              Still got questions? Feel free to reach out. We're happy to help.
            </p>

            <Link to="/contact" className="inline-block mt-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#09090b',
                }}
              >
                <span>→</span>
                <span>Ask a question</span>
              </motion.div>
            </Link>
          </div>

          {/* FAQ Items */}
          <div style={{ gridColumn: '2 / 5' }} className="space-y-0">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="border-b border-gray-200"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  style={{ paddingLeft: '20px', paddingRight: '16px' }}
                >
                  <span 
                    style={{
                      fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                      fontSize: 'clamp(18px, 2vw, 22px)',
                      fontWeight: 500,
                      letterSpacing: '-0.06em',
                      lineHeight: '1.3em',
                      color: '#09090b',
                    }}
                  >
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl flex-shrink-0 ml-4"
                    style={{ color: '#71717a' }}
                  >
                    ⌄
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? 'auto' : 0,
                    opacity: openIndex === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div 
                    className="pb-6"
                    style={{
                      fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                      fontSize: 'clamp(16px, 1.5vw, 18px)',
                      fontWeight: 500,
                      letterSpacing: '-0.03em',
                      lineHeight: '1.5em',
                      color: '#71717a',
                      paddingLeft: '20px',
                      paddingRight: '16px',
                    }}
                  >
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
