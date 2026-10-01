/**
 * Página Dashboard - resumo de gastos, com busca por mês e, opcionalmente,
 * por dia específico dentro do mês. Tudo é filtro sobre os dados já salvos —
 * nada é apagado, o histórico completo continua acessível a qualquer momento.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layout } from '../components';
import { TotalSpentCard, ExpensesByPlaceList, MonthSelector, DaySelector } from '../components/dashboard';
import { ExpenseList } from '../components/expenses';
import { useExpenses } from '../hooks/useExpenses';
import { useAllParcelas } from '../hooks/useParcelas';
import { calculateTotalSpent } from '../utils/calculations';
import {
  getCurrentYearMonth,
  getCurrentDay,
  getAvailableMonths,
  isExpenseInMonth,
  isExpenseOnDay,
  formatMonthLabel,
  yearMonthKey,
  type YearMonth,
} from '../utils/dateHelpers';

// Intervalo de checagem da data do sistema (1 minuto é suficiente
// para detectar a virada do dia/mês sem pesar no navegador)
const CHECK_INTERVAL_MS = 60 * 1000;

export const Dashboard: React.FC = () => {
  const { expenses, loading, error, editExpense } = useExpenses();
  const { parcelas } = useAllParcelas();

  // Mês exibido — começa sempre no mês atual
  const [selectedMonth, setSelectedMonth] = useState<YearMonth>(getCurrentYearMonth());

  // Dia específico dentro do mês (null = ver o mês inteiro)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Dia de hoje — atualizado automaticamente pelo timer abaixo
  const [today, setToday] = useState<number>(getCurrentDay());

  // Guarda o "mês atual real" da última checagem, para saber se o
  // usuário estava acompanhando o mês corrente ou navegou manualmente
  const lastKnownCurrentMonth = useRef<YearMonth>(getCurrentYearMonth());

  // Checagem automática: roda a cada minuto e detecta virada de dia/mês
  useEffect(() => {
    const checkForDateChange = () => {
      setToday(getCurrentDay());

      const nowYm = getCurrentYearMonth();
      const wasKey = yearMonthKey(lastKnownCurrentMonth.current);
      const nowKey = yearMonthKey(nowYm);

      if (wasKey === nowKey) return;

      setSelectedMonth((prevSelected) => {
        const usuarioEstavaNoMesAtual = yearMonthKey(prevSelected) === wasKey;
        return usuarioEstavaNoMesAtual ? nowYm : prevSelected;
      });

      lastKnownCurrentMonth.current = nowYm;
    };

    const interval = setInterval(checkForDateChange, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Lista fixa dos 12 meses do ano atual pro dropdown
  const availableMonths = useMemo(() => getAvailableMonths(), []);

  // Ao trocar de mês manualmente, volta a busca de dia para "Todos os dias"
  const handleMonthChange = (ym: YearMonth) => {
    setSelectedMonth(ym);
    setSelectedDay(null);
  };

  // Filtra os gastos: por mês, e se houver dia selecionado, por dia também
  const expensesFiltrados = useMemo(() => {
    if (selectedDay !== null) {
      return expenses.filter((e) => isExpenseOnDay(e, selectedMonth, selectedDay));
    }
    return expenses.filter((e) => isExpenseInMonth(e, selectedMonth));
  }, [expenses, selectedMonth, selectedDay]);

  const totalSpent = calculateTotalSpent(expensesFiltrados);
  const isMesAtual = yearMonthKey(selectedMonth) === yearMonthKey(getCurrentYearMonth());
  const isHoje = isMesAtual && selectedDay === today;

  // Dia exibido no rótulo: o dia pesquisado, ou (se "Todos os dias") o dia
  // de hoje quando for o mês atual, ou dia 1 quando for outro mês
  const diaExibido = selectedDay ?? (isMesAtual ? today : 1);
  const monthLabel = formatMonthLabel(selectedMonth, diaExibido);

  // Calcula quais gastos parcelados já tiveram todas as parcelas pagas
  const parcelasStatus = useMemo(() => {
    const byGasto: Record<string, typeof parcelas> = {};
    parcelas.forEach((p) => {
      if (!byGasto[p.gasto_id]) byGasto[p.gasto_id] = [];
      byGasto[p.gasto_id].push(p);
    });

    const map: Record<string, boolean> = {};
    Object.entries(byGasto).forEach(([gastoId, lista]) => {
      map[gastoId] = lista.length > 0 && lista.every((p) => p.paga);
    });
    return map;
  }, [parcelas]);

  return (
    <Layout navbarTitle="Controle de Gastos">
      <div className="space-y-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Erro ao carregar gastos:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Busca por mês e dia */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
            {monthLabel}
            {isHoje && (
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                Hoje
              </span>
            )}
            {isMesAtual && selectedDay === null && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Mês atual
              </span>
            )}
          </h2>
          <div className="flex gap-3">
            <MonthSelector
              availableMonths={availableMonths}
              selected={selectedMonth}
              onChange={handleMonthChange}
            />
            <DaySelector
              month={selectedMonth}
              selectedDay={selectedDay}
              onChange={setSelectedDay}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TotalSpentCard
            total={totalSpent}
            periodLabel={`Total em ${monthLabel}`}
            isLoading={loading}
          />
        </div>

        <ExpensesByPlaceList expenses={expensesFiltrados} isLoading={loading} />

        <ExpenseList
          expenses={expensesFiltrados}
          isLoading={loading}
          onUpdateExpense={(id, data) => editExpense(id, data)}
          parcelasStatus={parcelasStatus}
        />
      </div>
    </Layout>
  );
};