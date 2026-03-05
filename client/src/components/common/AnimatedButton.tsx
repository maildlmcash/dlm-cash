import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const AnimatedButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
}: AnimatedButtonProps) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 transform hover:scale-105 active:scale-95';
  
  const variants = {
    // Binance-like primary CTA (high-contrast, unmistakably a button)
    primary: 'bg-primary-500 text-dark-950 hover:bg-primary-400 shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 border border-primary-400/60 focus:ring-primary-500 font-extrabold',
    // Secondary action: light elevated button with black text
    secondary: 'bg-gray-200 text-black border border-gray-300 hover:border-gray-400 hover:bg-gray-300 shadow-lg hover:shadow-gray-400/30 focus:ring-accent-blue font-semibold',
    danger: 'bg-gradient-to-r from-error via-red-500 to-red-600 text-white hover:from-red-600 hover:via-red-500 hover:to-error shadow-xl shadow-error/30 hover:shadow-error/50 border-2 border-transparent hover:border-red-400/30 focus:ring-error font-bold',
    ghost: 'bg-transparent text-gray-700 hover:text-black hover:bg-gray-100 border-2 border-transparent hover:border-gray-300 focus:ring-accent-blue font-medium',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;

