/**
 * Serviço para operações CRUD de gastos no Supabase
 * Ao criar um gasto parcelado, também cria as parcelas correspondentes
 */

import { supabase } from './supabaseClient';
import { createParcelasForExpense } from './parcelasService';
import type { Expense, ExpenseFormData } from '../types/expense';

const TABLE_NAME = 'gastos';

/**
 * Busca todos os gastos do banco de dados
 * @returns Promessa contendo array de gastos
 */
export const getAllExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('data_compra', { ascending: false });

  if (error) {
    console.error('Erro ao buscar gastos:', error);
    throw error;
  }

  return data || [];
};

/**
 * Busca gastos dentro de um período
 * @param dataInicio - Data inicial (YYYY-MM-DD)
 * @param dataFim - Data final (YYYY-MM-DD)
 * @returns Promessa contendo array de gastos filtrados
 */
export const getExpensesByDateRange = async (
  dataInicio: string,
  dataFim: string
): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .gte('data_compra', dataInicio)
    .lte('data_compra', dataFim)
    .order('data_compra', { ascending: false });

  if (error) {
    console.error('Erro ao buscar gastos por período:', error);
    throw error;
  }

  return data || [];
};

/**
 * Cria um novo gasto no banco de dados
 * Se for parcelado, também cria as parcelas correspondentes automaticamente
 * @param expense - Dados do gasto a ser criado
 * @returns Promessa contendo o gasto criado
 */
export const createExpense = async (expense: ExpenseFormData): Promise<Expense> => {
  const payload = {
    ...expense,
    numero_parcelas:
      expense.forma_pagamento === 'parcelado' ? expense.numero_parcelas ?? null : null,
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar gasto:', error);
    throw error;
  }

  // Se for parcelado, cria as parcelas automaticamente
  if (expense.forma_pagamento === 'parcelado' && expense.numero_parcelas) {
    await createParcelasForExpense(data.id, expense.valor, expense.numero_parcelas);
  }

  return data;
};

/**
 * Atualiza um gasto existente
 * @param id - ID do gasto
 * @param expense - Dados atualizados do gasto
 * @returns Promessa contendo o gasto atualizado
 */
export const updateExpense = async (
  id: string,
  expense: Partial<ExpenseFormData>
): Promise<Expense> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(expense)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar gasto:', error);
    throw error;
  }

  return data;
};

/**
 * Deleta um gasto do banco de dados
 * @param id - ID do gasto a ser deletado
 * @returns Promessa vazia
 */
export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar gasto:', error);
    throw error;
  }
};

/**
 * Marca ou desmarca um gasto como pago para AMBAS as pessoas de uma vez
 * (campo antigo — mantido por compatibilidade com telas que ainda usam o
 * status combinado). Não precisa mais ler o estado atual antes: atualiza
 * os dois campos diretamente, e o campo "paga" é recalculado pelo próprio
 * banco automaticamente.
 *
 * Também grava a data/hora atual em AMBAS as colunas de data de pagamento
 * quando "paga" é true, e limpa (null) quando é false.
 * @param id - ID do gasto
 * @param paga - true para marcar como pago, false para desmarcar
 * @returns Promessa contendo o gasto atualizado
 */
export const toggleExpensePaga = async (id: string, paga: boolean): Promise<Expense> => {
  const dataPagamento = paga ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      paga_juliano: paga,
      paga_lidiane: paga,
      data_pagamento_juliano: dataPagamento,
      data_pagamento_lidiane: dataPagamento,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar status de pagamento:', error);
    throw error;
  }

  return data;
};

/**
 * Marca ou desmarca a parte de UMA pessoa (Juliano ou Lidiane) como paga
 * neste gasto.
 *
 * IMPORTANTE: atualiza SOMENTE o campo dessa pessoa, em uma única operação
 * atômica — não lê o estado atual antes de escrever. Isso permite clicar
 * em qualquer toggle, de qualquer compra, a qualquer momento, em qualquer
 * ordem (inclusive "adiantando" pagamentos fora de ordem), sem risco de um
 * clique "atropelar" outro que aconteceu quase ao mesmo tempo.
 *
 * Junto com o campo de "pago", também grava (ou limpa) a data/hora exata
 * em que essa pessoa marcou/desmarcou sua parte, para manter um histórico
 * de quando cada pagamento foi feito.
 *
 * O campo combinado "paga" é recalculado automaticamente pelo banco
 * (coluna gerada a partir de paga_juliano AND paga_lidiane), então nunca
 * precisa ser enviado por aqui.
 *
 * @param id - ID do gasto
 * @param pessoa - Qual pessoa está marcando/desmarcando sua parte
 * @param novoPaga - true para marcar como pago, false para desmarcar
 * @returns Promessa contendo o gasto atualizado
 */
export const toggleExpensePagaPessoa = async (
  id: string,
  pessoa: 'Juliano' | 'Lidiane',
  novoPaga: boolean
): Promise<Expense> => {
  const campoPaga = pessoa === 'Juliano' ? 'paga_juliano' : 'paga_lidiane';
  const campoData = pessoa === 'Juliano' ? 'data_pagamento_juliano' : 'data_pagamento_lidiane';

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      [campoPaga]: novoPaga,
      [campoData]: novoPaga ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar status de pagamento por pessoa:', error);
    throw error;
  }

  return data;
};