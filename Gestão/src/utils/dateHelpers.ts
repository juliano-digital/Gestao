/**
 * Funções auxiliares para lidar com mês/ano/dia dos gastos
 * Tudo aqui é FILTRO — nenhum dado é apagado ou alterado no banco.
 * Os gastos de qualquer mês/dia continuam salvos e acessíveis a qualquer momento.
 */
import type { Expense } from '../types/expense';

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Representa um mês/ano específico (month é 0-indexed, igual ao Date do JS) */
export interface YearMonth {
  year: number;
  month: number;
}

/** Retorna o mês/ano atual */
export const getCurrentYearMonth = (): YearMonth => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
};

/** Retorna o dia de hoje (1-31), lido direto do relógio do sistema */
export const getCurrentDay = (): number => {
  return new Date().getDate();
};

/** Quantos dias tem o mês (28-31), considerando ano bissexto corretamente */
export const getDaysInMonth = ({ year, month }: YearMonth): number => {
  // Dia 0 do mês seguinte = último dia do mês atual
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Formata data como "17/8/26 - Agosto".
 * @param ym - mês/ano a formatar
 * @param day - dia a exibir. Se omitido, usa 1.
 */
export const formatMonthLabel = (ym: YearMonth, day: number = 1): string => {
  const { year, month } = ym;
  const mes = month + 1; // month é 0-indexed
  const anoCurto = year % 100;
  return `${day}/${mes}/${anoCurto} - ${MESES_PT[month]}`;
};

/** Formata um YearMonth como apenas o nome do mês, ex: "Agosto" (usado nas opções do dropdown) */
export const formatMonthName = ({ month }: YearMonth): string => {
  return MESES_PT[month];
};

/** Chave única, ex: "2026-08" — útil para comparar ou usar como `key` de lista/option */
export const yearMonthKey = ({ year, month }: YearMonth): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

/** Extrai o mês/ano de uma data ISO (ex: data_compra de um gasto) */
export const yearMonthFromDate = (isoDate: string): YearMonth => {
  const date = new Date(isoDate);
  return { year: date.getFullYear(), month: date.getMonth() };
};

/** Extrai o dia (1-31) de uma data ISO */
export const dayFromDate = (isoDate: string): number => {
  return new Date(isoDate).getDate();
};

/** Verifica se um gasto pertence a um determinado mês/ano */
export const isExpenseInMonth = (expense: Expense, ym: YearMonth): boolean => {
  const expenseYm = yearMonthFromDate(expense.data_compra);
  return expenseYm.year === ym.year && expenseYm.month === ym.month;
};

/** Verifica se um gasto pertence a um dia específico dentro de um mês/ano */
export const isExpenseOnDay = (expense: Expense, ym: YearMonth, day: number): boolean => {
  return isExpenseInMonth(expense, ym) && dayFromDate(expense.data_compra) === day;
};

/**
 * Gera os 12 meses do ano atual para o dropdown (Janeiro a Dezembro),
 * independente de terem gasto registrado ou não.
 */
export const getAvailableMonths = (): YearMonth[] => {
  const { year } = getCurrentYearMonth();
  return Array.from({ length: 12 }, (_, i) => ({ year, month: i }));
};

/**
 * Gera a lista de dias disponíveis para o dropdown de dia, de acordo
 * com o mês selecionado (ex: Fevereiro gera 28 ou 29 dias, Agosto gera 31).
 */
export const getAvailableDays = (ym: YearMonth): number[] => {
  const total = getDaysInMonth(ym);
  return Array.from({ length: total }, (_, i) => i + 1);
};