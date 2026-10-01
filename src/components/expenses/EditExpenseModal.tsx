/**
 * Modal para editar uma compra existente.
 * Usado tanto na página do Juliano quanto na página da Lidiane,
 * já que a tabela "Todas as Compras" é a mesma em ambas.
 */

import React, { useState, useEffect } from 'react';
import type { Expense, ExpenseFormData } from '../../types/expense';

interface EditExpenseModalProps {
  expense: Expense | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<ExpenseFormData>) => Promise<void>;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ expense, onClose, onSave }) => {
  const [local, setLocal] = useState('');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'a_vista' | 'parcelado'>('a_vista');
  const [numeroParcelas, setNumeroParcelas] = useState('');
  const [responsavel, setResponsavel] = useState<'Juliano' | 'Lidiane'>('Juliano');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sempre que uma nova compra for aberta para edição, preenche o formulário com os dados dela
  useEffect(() => {
    if (expense) {
      setLocal(expense.local);
      setValor(String(expense.valor));
      setFormaPagamento(expense.forma_pagamento);
      setNumeroParcelas(expense.numero_parcelas ? String(expense.numero_parcelas) : '');
      setResponsavel(expense.responsavel as 'Juliano' | 'Lidiane');
      setError(null);
    }
  }, [expense]);

  if (!expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (!local.trim()) {
      setError('Informe o local da compra.');
      return;
    }
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setError('Informe um valor válido.');
      return;
    }
    if (formaPagamento === 'parcelado' && (!numeroParcelas || Number(numeroParcelas) < 2)) {
      setError('Informe o número de parcelas (mínimo 2).');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(expense.id, {
        local: local.trim(),
        valor: valorNumerico,
        forma_pagamento: formaPagamento,
        numero_parcelas: formaPagamento === 'parcelado' ? Number(numeroParcelas) : undefined,
        responsavel,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar alterações';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">✏️ Editar Compra</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ex: Supermercado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ex: 150.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comprado por</label>
            <select
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value as 'Juliano' | 'Lidiane')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="Juliano">Juliano</option>
              <option value="Lidiane">Lidiane</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as 'a_vista' | 'parcelado')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="a_vista">À vista</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </div>

          {formaPagamento === 'parcelado' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Parcelas</label>
              <input
                type="number"
                min={2}
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ex: 3"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 border border-gray-300 text-gray-700 rounded-md py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};