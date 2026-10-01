/**
 * Componente TotalSpentCard - Exibe o valor total gasto
 * Componente destacado no dashboard
 */

import React from 'react';
import { Card } from '../ui';
import { formatCurrency } from '../../utils/formatCurrency';

interface TotalSpentCardProps {
  total: number;
  periodLabel?: string;
  isLoading?: boolean;
}

/**
 * Componente que exibe o total gasto em um card grande
 * @param total - Valor total gasto
 * @param periodLabel - Rótulo do período (ex: "Este mês", "Este ano")
 * @param isLoading - Mostrar estado de carregamento
 */
export const TotalSpentCard: React.FC<TotalSpentCardProps> = ({
  total,
  periodLabel = 'Total Gasto',
  isLoading = false,
}) => {
  return (
    <Card className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl">
      <div className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold opacity-95">{periodLabel}</h3>
          <span className="text-3xl">💰</span>
        </div>
        {isLoading ? (
          <div className="text-2xl font-bold mt-6 animate-pulse">Carregando...</div>
        ) : (
          <div className="text-4xl font-bold mt-6">{formatCurrency(total)}</div>
        )}
      </div>
    </Card>
  );
};
