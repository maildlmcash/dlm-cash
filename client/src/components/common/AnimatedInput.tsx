import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

type BaseInputProps = {
  label?: string;
  error?: string;
  icon?: ReactNode;
  className?: string;
};

type InputProps = BaseInputProps & InputHTMLAttributes<HTMLInputElement> & {
  as?: 'input';
};

type SelectProps = BaseInputProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  as: 'select';
  children?: ReactNode;
};

type AnimatedInputProps = InputProps | SelectProps;

const AnimatedInput = forwardRef<HTMLInputElement | HTMLSelectElement, AnimatedInputProps>(
  ({ label, error, icon, className = '', as = 'input', children, ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {label && (
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 z-10">
              {icon}
            </div>
          )}
          {as === 'select' ? (
            <select
              ref={ref as React.Ref<HTMLSelectElement>}
              className={`w-full px-4 ${icon ? 'pl-12' : ''} py-3.5 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-all duration-300 cursor-pointer appearance-none shadow-lg text-base font-medium ${error ? 'border-error' : ''} ${className}`}
              style={{
                background: 'white',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%233B82F6' d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.75rem',
                colorScheme: 'light',
              }}
              {...(props as SelectHTMLAttributes<HTMLSelectElement>)}
            >
              {children}
            </select>
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              className={`w-full px-4 ${icon ? 'pl-12' : ''} py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${error ? 'border-error' : ''} ${className}`}
              {...(props as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-error"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

export default AnimatedInput;

