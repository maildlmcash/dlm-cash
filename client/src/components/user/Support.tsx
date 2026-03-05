import { useState } from 'react';
import { motion } from 'framer-motion';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import AnimatedButton from '../common/AnimatedButton';
import AnimatedInput from '../common/AnimatedInput';
import GlassCard from '../common/GlassCard';

const Support = () => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.description) {
      showToast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Implement support ticket API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast.success('Support ticket submitted successfully!');
      setFormData({
        subject: '',
        description: '',
        priority: 'MEDIUM',
      });
    } catch (error) {
      showToast.error('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      question: 'How do I invest in a plan?',
      answer: 'Go to Investment > Browse Plans, select a plan, and click "Invest Now". Make sure you have sufficient balance in your INR wallet.',
    },
    {
      question: 'How are ROI payments made?',
      answer: 'ROI is automatically credited to your ROI wallet based on the plan frequency (Daily/Weekly/Monthly).',
    },
    {
      question: 'What is the referral system?',
      answer: 'Invite friends using your referral code. You earn commissions when they invest, based on your referral level.',
    },
    {
      question: 'How do I withdraw funds?',
      answer: 'Go to Wallet, select your wallet type, and click "Withdraw". Enter the amount and confirm. Withdrawals are processed after admin approval.',
    },
    {
      question: 'What is KYC verification?',
      answer: 'KYC (Know Your Customer) verification is required for security. Upload your ID document and selfie. Once approved, you can make withdrawals.',
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
          Help & Support
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm">Get help with your account or submit a support ticket</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Support Ticket Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Submit Support Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatedInput
                label="Subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter subject"
                required
              />
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your issue..."
                  rows={6}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  required
                />
              </div>
              <AnimatedButton
                type="submit"
                disabled={submitting}
                fullWidth
                size="lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Submitting...</span>
                  </span>
                ) : (
                  '📧 Submit Ticket'
                )}
              </AnimatedButton>
            </form>
          </GlassCard>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <h3 className="text-gray-900 font-bold mb-2 flex items-start gap-2">
                    <span className="text-accent-lightBlue">Q:</span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-sm text-gray-600 ml-6">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <GlassCard className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Email Support', value: 'support@dlm.cash', icon: '📧' },
              { label: 'Response Time', value: 'Within 24 hours', icon: '⏱️' },
              { label: 'Business Hours', value: 'Mon - Fri, 9 AM - 6 PM', icon: '🕐' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center p-4 bg-white rounded-xl border border-gray-200"
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <p className="text-sm text-gray-600 mb-1 font-medium">{item.label}</p>
                <p className="text-gray-900 font-semibold">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Support;

