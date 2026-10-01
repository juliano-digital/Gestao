/**
 * Hook customizado para gerenciar estado e operações de gastos
 */

import { useState, useEffect } from 'react';
import type { Expense, ExpenseFormData } from '../types/expense';
import {
  getAllExpenses,
  getExpensesByDateRange,
  createExpense,
  updateExpense,
  deleteExpense,
  toggleExpensePaga,
  toggleExpensePagaPessoa,
} from '../services/expensesService';

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  fetchAllExpenses: () => Promise<void>;
  fetchExpensesByDateRange: (dataInicio: string, dataFim: string) => Promise<void>;
  addExpense: (expense: ExpenseFormData) => Promise<void>;
  editExpense: (id: string, expense: Partial<ExpenseFormData>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  togglePaga: (id: string, paga: boolean) => Promise<void>;
  togglePagaPessoa: (id: string, pessoa: 'Juliano' | 'Lidiane', paga: boolean) => Promise<void>;
}

export const useExpenses = (): UseExpensesReturn => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllExpenses();
      setExpenses(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar gastos';
      setError(message);
      console.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpensesByDateRange = async (dataInicio: string, dataFim: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExpensesByDateRange(dataInicio, dataFim);
      setExpenses(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar gastos por período';
      setError(message);
      console.error(message);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: ExpenseFormData) => {
    try {
      setError(null);
      const newExpense = await createExpense(expense);
      setExpenses((prev) => [newExpense, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar gasto';
      setError(message);
      console.error(message);
      throw err;
    }
  };

  const editExpense = async (id: string, expense: Partial<ExpenseFormData>) => {
    try {
      setError(null);
      const updatedExpense = await updateExpense(id, expense);
      setExpenses((prev) => prev.map((exp) => (exp.id === id ? updatedExpense : exp)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar gasto';
      setError(message);
      console.error(message);
      throw err;
    }
  };

  const removeExpense = async (id: string) => {
    try {
      setError(null);
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar gasto';
      setError(message);
      console.error(message);
      throw err;
    }
  };

  const togglePaga = async (id: string, paga: boolean) => {
    try {
      setError(null);
      const updated = await toggleExpensePaga(id, paga);
      setExpenses((prev) => prev.map((exp) => (exp.id === id ? updated : exp)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status de pagamento';
      setError(message);
      console.error(message);
      throw err;
    }
  };

  const togglePagaPessoa = async (id: string, pessoa: 'Juliano' | 'Lidiane', paga: boolean) => {
    try {
      setError(null);
      const updated = await toggleExpensePagaPessoa(id, pessoa, paga);
      setExpenses((prev) => prev.map((exp) => (exp.id === id ? updated : exp)));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar status de pagamento da pessoa';
      setError(message);
      console.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchAllExpenses();
  }, []);

  return {
    expenses,
    loading,
    error,
    fetchAllExpenses,
    fetchExpensesByDateRange,
    addExpense,
    editExpense,
    removeExpense,
    togglePaga,
    togglePagaPessoa,
  };
};