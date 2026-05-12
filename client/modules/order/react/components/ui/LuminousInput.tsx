import React from 'react';

interface LuminousInputProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: 'text' | 'number' | 'email';
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  min?: number;
  max?: number;
}

export const LuminousInput: React.FC<LuminousInputProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required = false,
  min,
  max,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-luminous-gold-muted mb-2 uppercase tracking-wider"
      >
        {label}
        {required && <span className="text-luminous-rose ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`
          w-full px-4 py-3 rounded-lg
          bg-luminous-bg-primary border
          text-luminous-text-primary placeholder-luminous-text-muted
          focus:outline-none focus:ring-2 focus:ring-luminous-gold/50 focus:border-luminous-gold
          transition-all duration-200
          ${error ? 'border-luminous-rose' : 'border-luminous-gold-border'}
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-luminous-rose">{error}</p>
      )}
    </div>
  );
};
