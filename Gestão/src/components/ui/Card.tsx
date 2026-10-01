/**
 * Componente Card - Cartão reutilizável para encapsular conteúdo
 */

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Componente de card para agrupar conteúdo
 * @param title - Título opcional do card
 * @param subtitle - Subtítulo opcional do card
 * @param children - Conteúdo do card
 * @param props - Props padrão de div HTML
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { title, subtitle, children, className = '', ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-lg shadow-md p-8
          border border-gray-200
          hover:shadow-lg transition-shadow duration-200
          ${className}
        `}
        {...props}
      >
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h3 className="text-2xl font-bold text-gray-800">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
