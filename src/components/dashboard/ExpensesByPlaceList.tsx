/**
 * Componente ExpensesByPlaceList - Lista o total gasto em cada local,
 * ordenado do maior para o menor, com paginação (7 por página)
 */

import React, { useMemo } from 'react';
import { Card, Pagination } from '../ui';
import { usePagination } from '../../hooks/usePagination';
import { formatCurrency } from '../../utils/formatCurrency';
import { groupByLocation } from '../../utils/calculations';
import type { Expense } from '../../types/expense';

interface ExpensesByPlaceListProps {
  expenses: Expense[];
  isLoading?: boolean;
}

interface LocationTotal {
  local: string;
  total: number;
}

export const ExpensesByPlaceList: React.FC<ExpensesByPlaceListProps> = ({
  expenses,
  isLoading = false,
}) => {
  // Agrupa por local e ordena do maior pro menor gasto
  const locationTotals: LocationTotal[] = useMemo(() => {
    const grouped = groupByLocation(expenses);
    return Object.entries(grouped)
      .map(([local, total]) => ({ local, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const { paginatedItems, currentPage, totalPages, goToPage } = usePagination(locationTotals, {
    itemsPerPage: 7,
  });

  if (isLoading) {
    return (
      <Card title="Gastos por Local">
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </Card>
    );
  }

  if (locationTotals.length === 0) {
    return (
      <Card title="Gastos por Local">
        <div className="text-center py-12">
          <p className="text-gray-600">Nenhum gasto registrado ainda.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Gastos por Local">
      <div className="space-y-3">
        {paginatedItems.map((item) => (
          <div
            key={item.local}
            className="flex items-center justify-between bg-gray-50 rounded-lg px-5 py-4"
          >
            <span className="font-medium text-gray-800">{item.local}</span>
            <span className="font-bold text-green-600">{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </Card>
  );
};