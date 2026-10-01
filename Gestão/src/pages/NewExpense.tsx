/**
 * Página NewExpense - Formulário para registrar um novo gasto
 * Após salvar com sucesso, redireciona automaticamente para o Dashboard
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components';
import { ExpenseForm } from '../components/expenses';
import { useExpenses } from '../hooks/useExpenses';
import type { ExpenseFormData } from '../types/expense';

/**
 * Página para criar novo gasto
 */
export const NewExpense: React.FC = () => {
  const { addExpense } = useExpenses();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (data: ExpenseFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      await addExpense(data);

      // Gasto salvo com sucesso -> redireciona para o Dashboard
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar gasto';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout navbarTitle="Novo Gasto">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Link de Volta */}
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4"
        >
          ← Voltar ao Dashboard
        </Link>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">❌ Erro:</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Formulário */}
        <ExpenseForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Informações Úteis */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Dicas:</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-2">
            <li>Preencha todos os campos obrigatórios marcados com *</li>
            <li>Se a compra foi parcelada, indique o número de parcelas</li>
            <li>A data e hora são registradas automaticamente</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};