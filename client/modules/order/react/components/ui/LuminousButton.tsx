import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'success';

interface LuminousButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-luminous-gold text-white hover:bg-luminous-gold/90 focus:ring-luminous-gold/50',
  secondary: 'bg-transparent border border-luminous-gold text-luminous-gold hover:bg-luminous-gold-glow focus:ring-luminous-gold/30',
  destructive: 'bg-luminous-rose text-white hover:bg-luminous-rose-hover focus:ring-luminous-rose/50',
  success: 'bg-luminous-sage text-white hover:bg-luminous-sage-hover focus:ring-luminous-sage/50',
};

export const LuminousButton: React.FC<LuminousButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-lg font-medium uppercase tracking-wider text-sm
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-luminous-bg-primary
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
