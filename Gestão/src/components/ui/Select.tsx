/**
 * Componente Select - Select reutilizável com label e mensagem de erro
 */

import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Componente de select com suporte a label, erro e texto de ajuda
 * @param label - Label do select
 * @param error - Mensagem de erro
 * @param helperText - Texto de ajuda
 * @param options - Array de opções para o select
 * @param placeholder - Texto placeholder
 * @param props - Props padrão de select HTML
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, helperText, options, placeholder, className = '', id = '', value, ...props },
    ref
  ) => {
    const selectId = id || Math.random().toString(36).substr(2, 9);
    const selectValue = value ?? '';

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold text-gray-800">
            {label} {props.required && <span className="text-red-600">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          value={selectValue}
          className={`
            w-full px-4 py-3 border-2 rounded-lg
            transition-all duration-200
            ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}
            focus:outline-none
            text-base text-gray-900
            bg-white
            cursor-pointer
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled={selectValue !== ''}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
        {helperText && !error && (
          <span className="text-sm text-gray-500">{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
