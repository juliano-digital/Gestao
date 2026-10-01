/**
 * Componente PendingInstallmentsSection - área reservada com as compras
 * parceladas que ainda têm parcela pendente. Acompanha automaticamente
 * pelos meses seguintes; quando a última parcela é paga, a compra some
 * sozinha dessa lista.
 */

import React, { useState } from 'react';
import { Card } from '../ui';
import { InstallmentsPanel } from './InstallmentsPanel';
import { formatCurrency, formatDateTime } from '../../utils/formatCurrency';
import type { PendingInstallmentGroup } from '../../utils/calculations';

interface PendingInstallmentsSectionProps {
  items: PendingInstallmentGroup[];
  isLoading?: boolean;
  accentColor?: 'blue' | 'pink';
  /** Chamado quando uma parcela é marcada/desmarcada dentro dessa seção,
   * para o componente pai recarregar os dados e o contador refletir na hora */
  onParcelaToggled?: () => void;
}

export const PendingInstallmentsSection: React.FC<PendingInstallmentsSectionProps> = ({
  items,
  isLoading = false,
  accentColor = 'blue',
  onParcelaToggled,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <Card title="🧾 Parcelas Pendentes">
        <div className="text-center py-8">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card title="🧾 Parcelas Pendentes">
        <div className="text-center py-8">
          <p className="text-gray-600">Nenhuma parcela pendente. Tudo em dia! ✅</p>
        </div>
      </Card>
    );
  }

  const barColor = accentColor === 'blue' ? 'bg-blue-600' : 'bg-pink-600';
  const badgeColor =
    accentColor === 'blue' ? 'text-blue-700 bg-blue-100' : 'text-pink-700 bg-pink-100';

  return (
    <Card
      title="🧾 Parcelas Pendentes"
      subtitle="Compras parceladas em andamento — somem daqui automaticamente quando todas as parcelas forem pagas"
    >
      <div className="space-y-3">
        {items.map(({ expense, parcelasPagas, parcelasTotal }) => {
          const isExpanded = expandedId === expense.id;
          const progresso = (parcelasPagas / parcelasTotal) * 100;

          return (
            <div key={expense.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleExpand(expense.id)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-800">{expense.local}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(expense.data_compra)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(expense.valor)}</p>
                    <p
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${badgeColor}`}
                    >
                      {parcelasPagas} de {parcelasTotal} pagas
                    </p>
                  </div>
                  <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              <div className="h-1.5 bg-gray-200">
                <div
                  className={`h-full ${barColor} transition-all`}
                  style={{ width: `${progresso}%` }}
                />
              </div>

              {isExpanded && (
                <div className="px-5 bg-white">
                  <InstallmentsPanel gastoId={expense.id} onParcelaToggled={onParcelaToggled} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};