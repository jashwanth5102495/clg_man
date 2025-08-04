import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = false }) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-800 
        rounded-xl border border-gray-700 
        transition-all duration-200 
        ${hover ? 'hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;