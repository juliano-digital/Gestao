/**
 * Componente ExpenseList - Lista de gastos com dados principais
 * Exibe os gastos em uma tabela paginada (7 por página), com edição inline
 * Mostra badge "Pago" quando todas as parcelas de um gasto estão quitadas
 */

import React, { useState } from 'react';
import type { Expense, ExpenseFormData } from '../../types/expense';
import { Card, Select, Input, Pagination } from '../ui';
import { usePagination } from '../../hooks/usePagination';
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyToNumber,
  formatDateTime,
  formatPaymentMethod,
} from '../../utils/formatCurrency';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onUpdateExpense?: (id: string, data: Partial<ExpenseFormData>) => Promise<void>;
  parcelasStatus?: Record<string, boolean>; // true = todas as parcelas do gasto foram pagas
}

const RESPONSAVEL_OPTIONS = [
  { value: 'Juliano', label: 'Juliano' },
  { value: 'Lidiane', label: 'Lidiane' },
];

const PAGAMENTO_OPTIONS = [
  { value: 'a_vista', label: '💵 À Vista' },
  { value: 'parcelado', label: '📊 Parcelado' },
];

interface EditableRowState {
  local: string;
  valor: string;
  forma_pagamento: 'a_vista' | 'parcelado' | '';
  numero_parcelas: string;
  responsavel: 'Juliano' | 'Lidiane' | '';
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  isLoading = false,
  onDelete,
  onUpdateExpense,
  parcelasStatus = {},
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditableRowState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const { paginatedItems, currentPage, totalPages, goToPage } = usePagination(expenses, {
    itemsPerPage: 7,
  });

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setRowError(null);
    setEditData({
      local: expense.local,
      valor: expense.valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      forma_pagamento: expense.forma_pagamento,
      numero_parcelas: expense.numero_parcelas?.toString() || '',
      responsavel: expense.responsavel as 'Juliano' | 'Lidiane',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData(null);
    setRowError(null);
  };

  const saveEditing = async (id: string) => {
    if (!onUpdateExpense || !editData) return;

    if (!editData.local || editData.local.trim().length < 3) {
      setRowError('Local deve ter pelo menos 3 caracteres');
      return;
    }
    const valorNumerico = parseCurrencyToNumber(editData.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setRowError('Valor deve ser maior que zero');
      return;
    }
    if (editData.forma_pagamento !== 'a_vista' && editData.forma_pagamento !== 'parcelado') {
      setRowError('Selecione a forma de pagamento');
      return;
    }
    if (editData.forma_pagamento === 'parcelado') {
      const n = Number(editData.numero_parcelas);
      if (isNaN(n) || n < 2) {
        setRowError('Informe o número de parcelas (mínimo 2)');
        return;
      }
    }
    if (editData.responsavel !== 'Juliano' && editData.responsavel !== 'Lidiane') {
      setRowError('Selecione o responsável');
      return;
    }

    try {
      setSavingId(id);
      setRowError(null);
      await onUpdateExpense(id, {
        local: editData.local.trim(),
        valor: valorNumerico,
        forma_pagamento: editData.forma_pagamento,
        numero_parcelas:
          editData.forma_pagamento === 'parcelado' ? Number(editData.numero_parcelas) : undefined,
        responsavel: editData.responsavel,
      });
      setEditingId(null);
      setEditData(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar alterações';
      setRowError(message);
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card title="📋 Gastos Registrados">
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando gastos...</p>
        </div>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card title="📋 Gastos Registrados">
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Nenhum gasto registrado ainda.</p>
          <p className="text-gray-500 mt-2">Clique em "Novo Gasto" na barra superior para começar.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="📋 Gastos Registrados">
      {rowError && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
          {rowError}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
            <tr>
              <th className="px-5 py-4 text-left font-bold text-gray-700">Local</th>
              <th className="px-5 py-4 text-left font-bold text-gray-700">Valor</th>
              <th className="px-5 py-4 text-left font-bold text-gray-700">Data/Hora</th>
              <th className="px-5 py-4 text-left font-bold text-gray-700">Pagamento</th>
              <th className="px-5 py-4 text-left font-bold text-gray-700">Responsável</th>
              <th className="px-5 py-4 text-center font-bold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((expense, idx) => {
              const isEditingThisRow = editingId === expense.id;
              const isSavingThisRow = savingId === expense.id;
              const estaPago =
                expense.forma_pagamento === 'parcelado' && parcelasStatus[expense.id] === true;

              if (isEditingThisRow && editData) {
                return (
                  <tr key={expense.id} className="border-b-2 border-blue-300 bg-blue-50">
                    <td className="px-3 py-3">
                      <Input
                        value={editData.local}
                        onChange={(e) => setEditData({ ...editData, local: e.target.value })}
                        className="!py-1.5 !px-2 text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        value={editData.valor}
                        inputMode="decimal"
                        onChange={(e) =>
                          setEditData({ ...editData, valor: formatCurrencyInput(e.target.value) })
                        }
                        className="!py-1.5 !px-2 text-sm"
                      />
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs italic">
                      {formatDateTime(expense.data_compra)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <Select
                          options={PAGAMENTO_OPTIONS}
                          value={editData.forma_pagamento}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              forma_pagamento: e.target.value as 'a_vista' | 'parcelado',
                            })
                          }
                          className="!py-1.5 !px-2 text-sm"
                        />
                        {editData.forma_pagamento === 'parcelado' && (
                          <Input
                            type="number"
                            min="2"
                            max="48"
                            placeholder="Nº parcelas"
                            value={editData.numero_parcelas}
                            onChange={(e) =>
                              setEditData({ ...editData, numero_parcelas: e.target.value })
                            }
                            className="!py-1.5 !px-2 text-sm"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Select
                        options={RESPONSAVEL_OPTIONS}
                        value={editData.responsavel}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            responsavel: e.target.value as 'Juliano' | 'Lidiane',
                          })
                        }
                        className="!py-1.5 !px-2 text-sm"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => saveEditing(expense.id)}
                          disabled={isSavingThisRow}
                          title="Salvar alterações"
                          className="text-green-600 hover:text-green-800 hover:bg-green-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          {isSavingThisRow ? '⏳' : '✓ Salvar'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isSavingThisRow}
                          title="Cancelar"
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={expense.id} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-5 py-4 font-medium text-gray-800">{expense.local}</td>
                  <td className="px-5 py-4 font-bold text-green-600">
                    {formatCurrency(expense.valor)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{formatDateTime(expense.data_compra)}</td>
                  <td className="px-5 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>{formatPaymentMethod(expense.forma_pagamento, expense.numero_parcelas)}</span>
                      {estaPago && (
                        <span className="text-green-700 font-semibold text-xs bg-green-100 px-2 py-0.5 rounded-full">
                          ✅ Pago
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{expense.responsavel}</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex gap-3 justify-center">
                      {onUpdateExpense && (
                        <button
                          onClick={() => startEditing(expense)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-3 py-1 rounded font-medium transition-colors"
                        >
                          ✏️ Editar
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100 px-3 py-1 rounded font-medium transition-colors"
                        >
                          🗑️ Deletar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </Card>
  );
};