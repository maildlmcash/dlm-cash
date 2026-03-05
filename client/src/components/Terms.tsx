import { motion } from 'framer-motion';
import Header from './landing/Header';
import Footer from './landing/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="w-full min-h-screen flex flex-col justify-start px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-16 sm:pb-20 relative z-10 bg-white">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 sm:mb-16"
          >
            <div className="flex items-start gap-3 mb-6 sm:mb-8" style={{ marginTop: '-8px' }}>
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
                LEGAL
              </span>
            </div>

            <h1 
              style={{
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                fontSize: 'clamp(64px, 12vw, 179px)',
                fontWeight: 600,
                letterSpacing: '-0.06em',
                lineHeight: '0.9em',
                color: '#09090b',
              }}
            >
              Terms of Service
            </h1>

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
              Last updated: December 19, 2025
            </p>
          </motion.div>

          {/* Terms Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl space-y-8"
          >
            {/* Introduction */}
            <div>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                PLEASE READ THESE TERMS OF SERVICE CAREFULLY BEFORE ACCESSING OR USING THE DLM CASH PLATFORM. BY CREATING AN ACCOUNT, ACCESSING, OR USING ANY PART OF THE PLATFORM, YOU CONFIRM THAT YOU HAVE READ, UNDERSTOOD, AND AGREED TO BE LEGALLY BOUND BY THESE TERMS, INCLUDING ALL POLICIES AND GUIDELINES INCORPORATED BY REFERENCE. IF YOU DO NOT AGREE WITH ANY PART OF THESE TERMS, YOU MUST NOT USE THE PLATFORM OR SERVICES.
              </p>
            </div>

            {/* Section 1 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                1. Definitions and Interpretation
              </h2>
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                1.1 Definitions
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                For the purposes of these Terms of Service, unless the context otherwise requires, the following terms shall have the meanings set out below:
              </p>
              <div className="space-y-3">
                <p 
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(16px, 2vw, 18px)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.6em',
                    color: '#71717a',
                  }}
                >
                  • <strong className="text-gray-900">"Agreement"</strong> means these Terms of Service, together with any schedules, annexes, policies, amendments, or updates published by DLM CASH from time to time.
                </p>
                <p 
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(16px, 2vw, 18px)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.6em',
                    color: '#71717a',
                  }}
                >
                  • <strong className="text-gray-900">"DLM CASH," "Platform," "we," "us," or "our"</strong> refers to DLM CASH and includes its parent entities, subsidiaries, affiliates, directors, officers, employees, contractors, agents, service providers, and authorized representatives.
                </p>
                <p 
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(16px, 2vw, 18px)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.6em',
                    color: '#71717a',
                  }}
                >
                  • <strong className="text-gray-900">"User," "you," or "your"</strong> means any individual or legal entity that accesses, registers on, or uses the Platform or Services, whether directly or indirectly.
                </p>
                <p 
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(16px, 2vw, 18px)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.6em',
                    color: '#71717a',
                  }}
                >
                  • <strong className="text-gray-900">"Services"</strong> means all features, tools, functionalities, investment products, referral systems, wallet services, dashboards, and related offerings made available through the Platform.
                </p>
                <p 
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(16px, 2vw, 18px)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.6em',
                    color: '#71717a',
                  }}
                >
                  • <strong className="text-gray-900">"Investment Plan"</strong> means any plan, scheme, or product that allows Users to deposit funds with the expectation of earning returns, incentives, rewards, or income, subject to specific terms and conditions.
                </p>
                <p 
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(16px, 2vw, 18px)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.6em',
                    color: '#71717a',
                  }}
                >
                  • <strong className="text-gray-900">"Digital Assets"</strong> means cryptocurrencies, stablecoins, tokens, or any other blockchain-based or digitally represented units of value supported by the Platform.
                </p>
                <p 
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(16px, 2vw, 18px)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.6em',
                    color: '#71717a',
                  }}
                >
                  • <strong className="text-gray-900">"KYC" (Know Your Customer)</strong> refers to the identity verification procedures required to comply with applicable laws, regulations, and internal compliance policies.
                </p>
              </div>
              
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                1.2 Interpretation
              </h3>
              <ul className="list-disc pl-6 space-y-2" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Headings are for convenience only and shall not affect interpretation.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Words in the singular include the plural and vice versa.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  References to laws include amendments, replacements, or re-enactments of such laws.
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                2. Acceptance of Terms and Amendments
              </h2>
              
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                2.1 Acceptance
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                By registering for an account, accessing, or using any Service on the Platform, you expressly acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  You are legally capable of entering into this Agreement.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  You have read and understood these Terms in their entirety.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  You agree to comply with all applicable laws, regulations, and Platform policies.
                </li>
              </ul>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                2.2 Modifications to Terms
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                DLM CASH reserves the right, at its sole discretion, to modify, update, amend, or replace these Terms at any time. Such changes may be made to reflect legal, regulatory, operational, or business developments.
              </p>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                2.3 Effect of Changes
              </h3>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Updated Terms will be effective immediately upon being posted on the Platform.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Your continued use of the Platform after any modification constitutes your acceptance of the revised Terms.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  It is your responsibility to review these Terms periodically to stay informed of updates.
                </li>
              </ul>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                2.4 Disagreement With Changes
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                If you do not agree with any updated or modified Terms, you must immediately stop using the Platform and close your account. Continued access or use will be deemed as acceptance.
              </p>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                2.5 Entire Agreement
              </h3>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                These Terms constitute the entire agreement between you and DLM CASH regarding the use of the Platform and supersede all prior discussions, representations, or agreements, whether oral or written.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                3. Investment Services
              </h2>
              
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                3.1 Nature of Services
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                DLM CASH provides access to various investment-related services through the Platform. These may include fixed or variable ROI plans, referral-based income structures, and wallet-based fund management systems.
              </p>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                3.2 Eligibility Requirements
              </h3>
              <p 
                className="mb-3"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                To use the investment Services, you must:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Be at least <strong className="text-gray-900">18 years of age</strong> or the legal age of majority in your jurisdiction.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Successfully complete KYC verification as required by the Platform.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Provide accurate, complete, and truthful information at all times.
                </li>
              </ul>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                3.3 No Guarantee of Returns
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                All investment plans are subject to market risks, operational risks, and other uncertainties. Returns are <strong className="text-gray-900">not guaranteed</strong>, and projected or historical returns do not represent future performance.
              </p>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                3.4 Compliance With Law
              </h3>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                You are solely responsible for ensuring that your participation in any investment plan is lawful in your jurisdiction.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                4. User Accounts and Responsibilities
              </h2>
              
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                4.1 Account Registration
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                To access certain Services, you must create an account. You agree to provide accurate and up-to-date information during registration.
              </p>


              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                4.2 Account Security
              </h3>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  You are responsible for maintaining the confidentiality of your login credentials.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  All activities performed through your account will be deemed to have been performed by you.
                </li>
              </ul>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                4.3 Unauthorized Access
              </h3>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                You must notify DLM CASH immediately if you suspect unauthorized access, loss of credentials, or any security breach related to your account.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                5. Referral Program
              </h2>
              
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                5.1 Program Overview
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                DLM CASH may offer referral or affiliate programs that allow Users to earn commissions or rewards by inviting new Users to the Platform.
              </p>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                5.2 Conditions
              </h3>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Referral rewards are subject to verification and eligibility checks.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Rewards may be delayed, adjusted, or reversed in case of suspected fraud or violation.
                </li>
              </ul>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                5.3 Prohibited Conduct
              </h3>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                Any attempt to manipulate, abuse, or exploit the referral system—including fake accounts, self-referrals, or automated activities—will result in suspension or termination and forfeiture of rewards.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                6. Wallets and Transactions
              </h2>
              
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                6.1 Wallet Types
              </h3>
              <p 
                className="mb-3"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                The Platform may provide multiple internal wallets, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  INR Wallet
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  USDT Wallet
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  ROI Wallet
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Salary Wallet
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Breakdown Wallet
                </li>
              </ul>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                6.2 Transactions
              </h3>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  All transactions are recorded digitally and, where applicable, on blockchain networks for transparency.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Once initiated, transactions may be irreversible.
                </li>
              </ul>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                6.3 Withdrawals
              </h3>
              <ul className="list-disc pl-6 space-y-2" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Withdrawal requests are generally processed within <strong className="text-gray-900">24–48 hours</strong>, subject to verification.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Minimum withdrawal limits, fees, or compliance checks may apply.
                </li>
              </ul>
            </div>

            {/* Section 7 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                7. Investment Risks and Disclaimers
              </h2>
              
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                7.1 Risk Disclosure
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                Investing involves substantial risk, including the possible loss of all invested funds. You acknowledge that you understand and accept these risks.
              </p>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                7.2 No Financial Advice
              </h3>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                DLM CASH does not provide legal, tax, or financial advice. All decisions are made at your own discretion. You are encouraged to consult independent professional advisors.
              </p>
            </div>

            {/* Section 8 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                8. Fees and Charges
              </h2>
              
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                8.1 Applicable Fees
              </h3>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                The Platform may charge fees for certain Services, including transaction processing, withdrawals, maintenance, or plan participation.
              </p>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                8.2 Fee Disclosure
              </h3>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                All applicable fees will be disclosed prior to confirmation of any transaction or participation in a plan.
              </p>
            </div>

            {/* Section 9 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                9. Suspension and Termination
              </h2>
              
              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                9.1 Right to Terminate
              </h3>
              <p 
                className="mb-3"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                DLM CASH reserves the right to suspend or terminate your account at any time if:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  You violate these Terms.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  You engage in fraudulent, abusive, or unlawful activities.
                </li>
              </ul>

              <h3 
                className="mb-3 mt-6"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#09090b',
                }}
              >
                9.2 Effect of Termination
              </h3>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                Upon termination, access to the Platform will be restricted. Remaining balances may be withdrawn subject to verification and applicable rules.
              </p>
            </div>

            {/* Section 10 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                10. Limitation of Liability
              </h2>
              <p 
                className="mb-3"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 space-y-2" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  DLM CASH shall not be liable for indirect, incidental, consequential, or punitive damages.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Total liability, if any, shall be limited to the amount invested by you on the Platform.
                </li>
              </ul>
            </div>

            {/* Section 11 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                11. Indemnification
              </h2>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                You agree to indemnify and hold harmless DLM CASH from any claims, losses, liabilities, damages, or expenses arising from your misuse of the Platform or violation of these Terms.
              </p>
            </div>

            {/* Section 12 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                12. Governing Law and Jurisdiction
              </h2>
              <p 
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                These Terms shall be governed by and construed in accordance with the applicable laws of the relevant jurisdiction, without regard to conflict-of-law principles.
              </p>
            </div>

            {/* Section 13 */}
            <div>
              <h2 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#09090b',
                }}
              >
                13. Contact Information
              </h2>
              <p 
                className="mb-4"
                style={{
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.6em',
                  color: '#71717a',
                }}
              >
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a 
                  href="mailto:maildlm.cash@gmail.com"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    fontWeight: 500,
                    color: '#71717a',
                  }}
                  className="hover:text-black transition-colors"
                >
                  maildlm.cash@gmail.com
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
