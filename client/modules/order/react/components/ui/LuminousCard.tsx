import React from 'react';

interface LuminousCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const LuminousCard: React.FC<LuminousCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-luminous-bg-card rounded-xl p-6
        border border-luminous-gold-border
        shadow-[0_4px_20px_rgba(201,162,39,0.08)]
        ${hoverable ? 'cursor-pointer hover:border-luminous-gold hover:shadow-[0_8px_30px_rgba(201,162,39,0.12)] transition-all duration-300' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
