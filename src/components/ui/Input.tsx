/**
 * Componente Input - Input reutilizável com label e mensagem de erro
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Componente de input com suporte a label, erro e texto de ajuda
 * @param label - Label do input
 * @param error - Mensagem de erro
 * @param helperText - Texto de ajuda
 * @param props - Props padrão de input HTML
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, className = '', id = '', ...props },
    ref
  ) => {
    const inputId = id || Math.random().toString(36).substr(2, 9);

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-gray-800">
            {label} {props.required && <span className="text-red-600">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 border-2 rounded-lg
            transition-all duration-200
            ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}
            focus:outline-none
            text-base text-gray-900
            placeholder-gray-500
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
        {helperText && !error && (
          <span className="text-sm text-gray-500">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
