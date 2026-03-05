import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  blur?: boolean;
}

const GlassCard = ({ children, className = '' }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative bg-white border border-gray-200 rounded-2xl p-6 shadow-lg ${className}`}
      style={{
        boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      }}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;

