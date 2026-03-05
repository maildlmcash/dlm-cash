import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-2xl w-[90%] sm:w-[85%] md:w-[75%] lg:w-[500px] xl:w-[550px] 2xl:w-[600px] overflow-hidden animate-slideUp">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl backdrop-blur-sm z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">
              {type === 'danger' ? '⚠️' : type === 'warning' ? '⚠️' : 'ℹ️'} {title}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900 transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Modal Body */}
        <div className="p-6">
          <p className="text-gray-800 mb-6 leading-relaxed">{message}</p>
        </div>
        
        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl -mx-6 -mb-6 backdrop-blur-sm">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-xl hover:bg-gray-300 transition-all border border-gray-300 hover:border-gray-400"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-3 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-opacity-50 transform hover:scale-105 active:scale-95 ${
                type === 'danger' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 hover:shadow-red-500/50'
                  : type === 'warning'
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-600 hover:shadow-yellow-500/50'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-500/50'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

