import { motion } from 'framer-motion';
import { useState } from 'react';
import Header from './landing/Header';
import Footer from './landing/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
                CONTACT
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
              Contact
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
              Get in touch with us. We're here to help.
            </p>

            <div className="mt-4 flex items-center gap-2">
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
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-[30%] min-w-[350px]"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#09090b',
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '16px',
                  }}
                  placeholder="Your name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#09090b',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '16px',
                  }}
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Subject Field */}
              <div>
                <label
                  htmlFor="subject"
                  className="block mb-2"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#09090b',
                  }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '16px',
                  }}
                  placeholder="How can we help?"
                />
              </div>

              {/* Message Field */}
              <div>
                <label
                  htmlFor="message"
                  className="block mb-2"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#09090b',
                  }}
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all resize-none"
                  style={{
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontSize: '16px',
                  }}
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-full text-black font-semibold flex items-center gap-2"
                style={{
                  backgroundColor: '#d6b3ff',
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontSize: '16px',
                }}
              >
                <span>→</span>
                <span>Send Message</span>
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
