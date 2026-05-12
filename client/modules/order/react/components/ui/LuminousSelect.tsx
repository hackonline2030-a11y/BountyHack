import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface LuminousSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  error?: string | null;
  required?: boolean;
  placeholder?: string;
}

export const LuminousSelect: React.FC<LuminousSelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  placeholder,
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
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`
          w-full px-4 py-3 rounded-lg
          bg-luminous-bg-primary border
          text-luminous-text-primary
          focus:outline-none focus:ring-2 focus:ring-luminous-gold/50 focus:border-luminous-gold
          transition-all duration-200
          ${error ? 'border-luminous-rose' : 'border-luminous-gold-border'}
        `}
      >
        {placeholder && (
          <option value="" className="text-luminous-text-secondary">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-luminous-rose">{error}</p>
      )}
    </div>
  );
};
