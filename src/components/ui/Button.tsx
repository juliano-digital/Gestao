/**
 * Componente Button - Botão reutilizável com variantes
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Componente de botão com suporte a diferentes variantes e tamanhos
 * @param variant - Estilo do botão (primary, secondary, danger, outline)
 * @param size - Tamanho do botão (sm, md, lg)
 * @param isLoading - Mostrar estado de carregamento
 * @param children - Conteúdo do botão
 * @param props - Props padrão de button HTML
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95';

    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed',
      secondary: 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed',
      danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⟳</span>
            <span>Processando...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
