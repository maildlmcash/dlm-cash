import { motion } from 'framer-motion';
import Header from './landing/Header';
import Footer from './landing/Footer';

const Privacy = () => {
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
              Privacy Policy
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

          {/* Privacy Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl space-y-8"
          >
            {/* Introduction */}
            <div className="mb-8">
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
                This Privacy Policy describes how <strong className="text-gray-900">DLM CASH</strong> ("we," "our," or "us") collects, uses, discloses, and protects your personal information when you access or use our investment services platform (the "Platform").
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
                1. Information We Collect
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
                1.1 Personal Information
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
                We may collect the following types of information:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  <strong className="text-gray-900">Identity Information:</strong> Full name, date of birth, nationality, and identification numbers.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  <strong className="text-gray-900">Contact Information:</strong> Email address, phone number, mailing address.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  <strong className="text-gray-900">KYC Documents:</strong> Government-issued ID, proof of address, photographs, and other verification documents.
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
                1.2 Financial Information
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
                We collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Bank account details, wallet addresses, payment methods.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Transaction history, deposit and withdrawal records.
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
                1.3 Technical Information
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
                We automatically collect:
              </p>
              <ul className="list-disc pl-6 space-y-2" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Device information, IP address, browser type, operating system.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Usage data, logs, session information.
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
                2. How We Use Your Information
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
                2.1 Service Provision
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
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Create and manage your account.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Process investments, deposits, and withdrawals.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Communicate updates, notifications, and support.
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
                2.2 Compliance and Security
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
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Perform KYC and AML checks as required by law.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Prevent fraud, money laundering, or illegal activities.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Protect the security and integrity of the Platform.
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
                2.3 Improvement and Analytics
              </h3>
              <ul className="list-disc pl-6 space-y-2" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Analyze user behavior to improve our services.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Develop new features and enhance user experience.
                </li>
              </ul>
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
                3. Blockchain and Transaction Transparency
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
                By using our Platform, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-2" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Certain transactions may be recorded on a <strong className="text-gray-900">public blockchain</strong>, which is immutable and transparent.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  While we endeavor to protect your identity, blockchain addresses and transaction amounts may be publicly visible.
                </li>
              </ul>
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
                4. Sharing of Information
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
                4.1 Third-Party Service Providers
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
                We may share information with trusted third parties to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Verify identity (KYC/AML providers).
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Process payments.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  Host and maintain the Platform.
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
                4.2 Legal Obligations
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
                We may disclose your information if required by law, court order, or regulatory authorities.
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
                4.3 No Sale of Information
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
                We do not sell or rent your personal information to third parties for marketing purposes.
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
                5. Cookies and Tracking Technologies
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
                5.1 Use of Cookies
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
                We use cookies to improve your experience, analyze usage patterns, and remember preferences. You may disable cookies in your browser, though this may affect functionality.
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
                5.2 Analytics
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
                We may use third-party analytics services (e.g., Google Analytics) to track user activity.
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
                6. Data Security
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
                6.1 Security Measures
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
                We use encryption, secure servers, and access controls to safeguard your data. However, no system is entirely foolproof, and we cannot guarantee absolute security.
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
                6.2 Your Responsibility
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
                You are responsible for maintaining the confidentiality of your account credentials.
              </p>
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
                7. Your Rights
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
                Depending on your jurisdiction, you may have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  <strong className="text-gray-900">Access</strong> your personal data.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  <strong className="text-gray-900">Correct</strong> inaccurate information.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  <strong className="text-gray-900">Delete</strong> your data (subject to legal and regulatory requirements).
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  <strong className="text-gray-900">Object</strong> to processing of your information.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  <strong className="text-gray-900">Withdraw consent</strong> where applicable.
                </li>
              </ul>
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
                8. Data Retention
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
                We retain personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4" style={{ color: '#71717a' }}>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  For as long as your account is active.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  As needed to comply with legal or regulatory obligations.
                </li>
                <li style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 500, lineHeight: '1.6em' }}>
                  To resolve disputes or enforce agreements.
                </li>
              </ul>
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
                <strong className="text-gray-900">Note:</strong> Blockchain data is immutable and cannot be deleted.
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
                9. Changes to This Policy
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
                We may update this Privacy Policy periodically. Changes will be reflected by updating the "Last updated" date. Continued use of the Platform following any changes constitutes acceptance of the revised policy.
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
                10. Contact Us
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
                If you have any questions, concerns, or requests related to this Privacy Policy, please reach out to us at:
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

export default Privacy;
