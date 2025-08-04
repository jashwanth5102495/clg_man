import React from 'react';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ onClose, children, className }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className={`bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 max-w-lg w-full ${className || ''}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-6 text-gray-500 hover:text-gray-900 text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;