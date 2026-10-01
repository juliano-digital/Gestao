/**
 * Funções auxiliares para cálculos e agregações de dados de gastos
 */
import type { Expense, Parcela } from '../types/expense';

/**
 * Calcula o valor total de todos os gastos
 * @param expenses - Array de gastos
 * @returns Valor total em número
 */
export const calculateTotalSpent = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.valor, 0);
};

/**
 * Agrupa gastos por local e calcula soma por local
 * @param expenses - Array de gastos
 * @returns Objeto com local como chave e valor total como valor
 */
export const groupByLocation = (
  expenses: Expense[]
): Record<string, number> => {
  return expenses.reduce((acc, expense) => {
    if (!acc[expense.local]) {
      acc[expense.local] = 0;
    }
    acc[expense.local] += expense.valor;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Agrupa gastos por responsável e calcula soma por responsável
 * @param expenses - Array de gastos
 * @returns Objeto com responsável como chave e valor total como valor
 */
export const groupByResponsible = (
  expenses: Expense[]
): Record<string, number> => {
  return expenses.reduce((acc, expense) => {
    if (!acc[expense.responsavel]) {
      acc[expense.responsavel] = 0;
    }
    acc[expense.responsavel] += expense.valor;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Calcula o valor médio dos gastos
 * @param expenses - Array de gastos
 * @returns Valor médio em número
 */
export const calculateAverageExpense = (expenses: Expense[]): number => {
  if (expenses.length === 0) return 0;
  return calculateTotalSpent(expenses) / expenses.length;
};

/**
 * Encontra o gasto de maior valor
 * @param expenses - Array de gastos
 * @returns Objeto do gasto ou null se array vazio
 */
export const findHighestExpense = (expenses: Expense[]): Expense | null => {
  if (expenses.length === 0) return null;
  return expenses.reduce((max, expense) =>
    expense.valor > max.valor ? expense : max
  );
};

/**
 * Encontra o gasto de menor valor
 * @param expenses - Array de gastos
 * @returns Objeto do gasto ou null se array vazio
 */
export const findLowestExpense = (expenses: Expense[]): Expense | null => {
  if (expenses.length === 0) return null;
  return expenses.reduce((min, expense) =>
    expense.valor < min.valor ? expense : min
  );
};

/**
 * Filtra gastos por forma de pagamento
 * @param expenses - Array de gastos
 * @param formaPagamento - 'a_vista' ou 'parcelado'
 * @returns Array de gastos filtrados
 */
export const filterByPaymentMethod = (
  expenses: Expense[],
  formaPagamento: 'a_vista' | 'parcelado'
): Expense[] => {
  return expenses.filter(expense => expense.forma_pagamento === formaPagamento);
};

/**
 * Calcula o total de gastos parcelados (que ainda não foram totalmente pagos)
 * Útil para saber quanto ainda falta pagar
 * @param expenses - Array de gastos
 * @returns Valor total de gastos parcelados
 */
export const calculateInstallmentTotal = (expenses: Expense[]): number => {
  return filterByPaymentMethod(expenses, 'parcelado')
    .reduce((total, expense) => total + expense.valor, 0);
};

/**
 * Informações de saldo entre Juliano e Lidiane
 * Todo gasto (à vista ou parcelado) é dividido meio a meio,
 * independentemente de quem pagou.
 */
export interface BalanceInfo {
  totalGeral: number;
  cotaCadaUm: number; // metade do total geral - o que cada um "deveria" ter pago
  totalPagoJuliano: number;
  totalPagoLidiane: number;
  saldoJuliano: number; // positivo = Lidiane deve pra ele; negativo = ele deve pra Lidiane
  saldoLidiane: number; // positivo = Juliano deve pra ela; negativo = ela deve pro Juliano
}

/**
 * Calcula o saldo entre Juliano e Lidiane, dividindo todo gasto meio a meio
 * @param expenses - Array de todos os gastos (de ambos)
 * @returns Objeto com os totais e saldos de cada pessoa
 */
export const calculateBalance = (expenses: Expense[]): BalanceInfo => {
  const totalGeral = calculateTotalSpent(expenses);
  const cotaCadaUm = totalGeral / 2;

  const totalPagoJuliano = expenses
    .filter((e) => e.responsavel === 'Juliano')
    .reduce((sum, e) => sum + e.valor, 0);

  const totalPagoLidiane = expenses
    .filter((e) => e.responsavel === 'Lidiane')
    .reduce((sum, e) => sum + e.valor, 0);

  const saldoJuliano = totalPagoJuliano - cotaCadaUm;
  const saldoLidiane = totalPagoLidiane - cotaCadaUm;

  return {
    totalGeral,
    cotaCadaUm,
    totalPagoJuliano,
    totalPagoLidiane,
    saldoJuliano,
    saldoLidiane,
  };
};

/**
 * Agrupa uma compra parcelada com suas parcelas, para acompanhamento
 * do progresso de pagamento (ex: "2 de 3 pagas")
 */
export interface PendingInstallmentGroup {
  expense: Expense;
  parcelas: Parcela[];
  parcelasPagas: number;
  parcelasTotal: number;
}

/**
 * Retorna apenas as compras parceladas que AINDA têm parcela pendente.
 * Assim que a última parcela de uma compra é marcada como paga, ela
 * some automaticamente dessa lista (não precisa de nenhuma ação manual).
 * @param expenses - todos os gastos
 * @param parcelas - todas as parcelas de todos os gastos
 */
export const getPendingInstallments = (
  expenses: Expense[],
  parcelas: Parcela[]
): PendingInstallmentGroup[] => {
  const parceladas = expenses.filter((e) => e.forma_pagamento === 'parcelado');

  const parcelasPorGasto: Record<string, Parcela[]> = {};
  parcelas.forEach((p) => {
    if (!parcelasPorGasto[p.gasto_id]) parcelasPorGasto[p.gasto_id] = [];
    parcelasPorGasto[p.gasto_id].push(p);
  });

  const pendentes: PendingInstallmentGroup[] = [];

  parceladas.forEach((expense) => {
    const lista = parcelasPorGasto[expense.id] || [];
    if (lista.length === 0) return;

    const parcelasPagas = lista.filter((p) => p.paga).length;
    const parcelasTotal = lista.length;

    // Só entra na lista se AINDA faltar pelo menos uma parcela paga
    if (parcelasPagas < parcelasTotal) {
      pendentes.push({ expense, parcelas: lista, parcelasPagas, parcelasTotal });
    }
  });

  // Mais recentes primeiro
  return pendentes.sort(
    (a, b) => new Date(b.expense.data_compra).getTime() - new Date(a.expense.data_compra).getTime()
  );
};