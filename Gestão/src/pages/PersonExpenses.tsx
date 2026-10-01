/**
 * Página PersonExpenses - Mostra as compras do mês/dia selecionado (filtro
 * só afeta a TABELA abaixo), com a parte (metade) de cada uma atribuída à
 * pessoa da página. Compras parceladas podem ser expandidas para ver e
 * marcar cada parcela como paga. Qualquer compra pode ser marcada como
 * paga, deixando a linha verde escura. Compras também podem ser editadas
 * através de um modal.
 *
 * O pagamento é controlado SEPARADAMENTE por pessoa: quando o Juliano marca
 * uma compra (ou parcela) como paga, isso só afeta a página dele — a página
 * da Lidiane continua mostrando aquele valor como não pago até ela também
 * marcar a parte dela.
 *
 * PENDÊNCIAS ARRASTAM PARA OS MESES SEGUINTES: quando "Todos os dias" está
 * selecionado, a tabela mostra as compras do mês escolhido MAIS qualquer
 * compra de mês anterior que essa pessoa ainda não pagou totalmente
 * (à vista não marcada, ou parcelada com pelo menos uma parcela em aberto).
 * Essas pendências continuam aparecendo, mês após mês, até serem quitadas —
 * ninguém precisa voltar no calendário pra achar uma pendência antiga.
 * Assim que ficam totalmente pagas por essa pessoa, param de arrastar e só
 * aparecem no mês original delas, como histórico. Quando um dia específico
 * é selecionado, o arrasto não se aplica — mostra só o que foi comprado
 * naquele dia exato.
 *
 * Cada vez que uma compra (ou parcela) é marcada como paga, o dia/mês/ano
 * exato é registrado e fica exibido junto do status "Paga". Para evitar que
 * um clique acidental apague esse registro, DESMARCAR uma compra já paga
 * abre um aviso pedindo confirmação antes de executar — marcar como paga
 * continua acontecendo na hora, sem esse aviso.
 *
 * O card mostra a data de hoje (atualiza sozinha quando o dia vira) e três
 * números:
 *  - "À vista devido": soma de cada compra à vista não paga.
 *  - "Parcelas devidas": soma de cada parcela não paga (todas, não só a
 *    próxima de cada compra).
 *  - "Já pago": contador vitalício de tudo que já foi marcado como pago,
 *    de qualquer mês.
 * Qualquer toggle clicado — parcela ou à vista, em qualquer ordem — muda
 * o campo correspondente na hora.
 *
 * Abaixo do card tem um detalhamento (temporário, para conferência) de
 * cada item que está entrando na conta do "devido no mês".
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout, Card } from '../components';
import { InstallmentsPanel } from '../components/expenses/InstallmentsPanel';
import { EditExpenseModal } from '../components/expenses/EditExpenseModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useExpenses } from '../hooks/useExpenses';
import { useAllParcelas } from '../hooks/useParcelas';
import { formatCurrency, formatDateTime, formatPaymentMethod } from '../utils/formatCurrency';
import {
  calcularResumoAtual,
  parseDataLocal,
  getMesAnoAtual,
  expensePendentePorPessoa,
} from '../utils/faturaCalculations';
import type { Expense } from '../types/expense';

// Checa a cada minuto se o dia virou, pra atualizar a data exibida e recalcular o mês
const CHECK_INTERVAL_MS = 60 * 1000;

const PESSOAS_VALIDAS: Record<string, 'Juliano' | 'Lidiane'> = {
  juliano: 'Juliano',
  lidiane: 'Lidiane',
};

const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface MesRef {
  ano: number;
  mes: number; // 0-indexado
}

function mesRefKey(m: MesRef): string {
  return `${m.ano}-${m.mes}`;
}

/** Gera uma lista de meses para o seletor: 11 meses pra trás e 2 pra frente */
function gerarOpcoesMeses(hoje: Date): MesRef[] {
  const opcoes: MesRef[] = [];
  for (let i = -11; i <= 2; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    opcoes.push({ ano: d.getFullYear(), mes: d.getMonth() });
  }
  return opcoes;
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate();
}

const formatDataCompleta = (data: Date): string =>
  data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

/** true se a data (ano/mês) for anterior ao mês de referência informado */
function ehMesAnterior(data: Date, ref: MesRef): boolean {
  return data.getFullYear() < ref.ano || (data.getFullYear() === ref.ano && data.getMonth() < ref.mes);
}

export const PersonExpenses: React.FC = () => {
  const { pessoa } = useParams<{ pessoa: string }>();
  const { expenses, loading, error, togglePagaPessoa, editExpense } = useExpenses();
  const { parcelas, loading: loadingParcelas, updateLocal: updateParcelaLocal } = useAllParcelas();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [mostrarDetalhamento, setMostrarDetalhamento] = useState(false);

  // Compra à vista aguardando confirmação para ser DESMARCADA (null = nenhum aviso aberto)
  const [expenseParaDesmarcar, setExpenseParaDesmarcar] = useState<Expense | null>(null);

  // Data de hoje, usada para o card. Atualizada periodicamente para trocar
  // sozinha quando o dia virar, sem precisar recarregar a página.
  const [agora, setAgora] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Filtro de mês/dia: afeta SÓ a tabela de compras, não o card
  const [selectedMes, setSelectedMes] = useState<MesRef>(() => {
    const { ano, mes } = getMesAnoAtual();
    return { ano, mes };
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const opcoesMeses = useMemo(() => gerarOpcoesMeses(new Date()), []);

  const handleMonthChange = (value: string) => {
    const [ano, mes] = value.split('-').map(Number);
    setSelectedMes({ ano, mes });
    setSelectedDay(null);
  };

  const nomePessoa = pessoa ? PESSOAS_VALIDAS[pessoa.toLowerCase()] : undefined;

  // Card: baseado na data de hoje, reage a qualquer toggle na hora
  const resumo = useMemo(
    () => (nomePessoa ? calcularResumoAtual(expenses, parcelas, nomePessoa, agora) : null),
    [expenses, parcelas, nomePessoa, agora]
  );

  // Tabela: compras do mês/dia selecionado + (quando "Todos os dias") as
  // pendências arrastadas de meses anteriores que essa pessoa ainda não
  // quitou totalmente.
  const expensesFiltrados = useMemo(() => {
    const doMesSelecionado = expenses.filter((e) => {
      const data = parseDataLocal(e.data_compra);
      const mesmoMes = data.getFullYear() === selectedMes.ano && data.getMonth() === selectedMes.mes;
      if (!mesmoMes) return false;
      if (selectedDay !== null && data.getDate() !== selectedDay) return false;
      return true;
    });

    // Arrasto só faz sentido olhando o mês inteiro (não um dia específico)
    // e só sabemos calcular pendência de parcelada com a pessoa definida.
    if (selectedDay !== null || !nomePessoa) return doMesSelecionado;

    const idsJaIncluidos = new Set(doMesSelecionado.map((e) => e.id));

    const arrastadosDeMesesAnteriores = expenses.filter((e) => {
      if (idsJaIncluidos.has(e.id)) return false;
      const data = parseDataLocal(e.data_compra);
      if (!ehMesAnterior(data, selectedMes)) return false;
      return expensePendentePorPessoa(e, parcelas, nomePessoa);
    });

    return [...doMesSelecionado, ...arrastadosDeMesesAnteriores];
  }, [expenses, parcelas, selectedMes, selectedDay, nomePessoa]);

  if (!nomePessoa) {
    return (
      <Layout navbarTitle="Página não encontrada">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Pessoa não encontrada.</p>
          <Link to="/" className="text-blue-600 hover:underline font-medium">
            ← Voltar ao Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const corDestaque = nomePessoa === 'Juliano' ? 'blue' : 'pink';
  const carregando = loading || loadingParcelas;
  const totalDiasNoMes = diasNoMes(selectedMes.ano, selectedMes.mes);

  const pagaPelaPessoa = (expense: Expense): boolean =>
    nomePessoa === 'Juliano' ? expense.paga_juliano : expense.paga_lidiane;

  /** Data em que essa pessoa marcou esta compra como paga (ou undefined/null) */
  const dataPagamentoDaPessoa = (expense: Expense): string | null | undefined =>
    nomePessoa === 'Juliano' ? expense.data_pagamento_juliano : expense.data_pagamento_lidiane;

  /** true se essa linha é uma pendência arrastada de um mês anterior ao selecionado */
  const isArrastada = (expense: Expense): boolean => {
    const data = parseDataLocal(expense.data_compra);
    return ehMesAnterior(data, selectedMes);
  };

  const rotuloMesOrigem = (expense: Expense): string => {
    const data = parseDataLocal(expense.data_compra);
    return `${NOMES_MES[data.getMonth()]} de ${data.getFullYear()}`;
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const executarTogglePaga = async (expense: Expense, novoPaga: boolean) => {
    try {
      setTogglingId(expense.id);
      await togglePagaPessoa(expense.id, nomePessoa, novoPaga);
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleTogglePaga = async (expense: Expense) => {
    const estaPaga = pagaPelaPessoa(expense);

    // Marcar como paga: instantâneo, sem confirmação
    if (!estaPaga) {
      await executarTogglePaga(expense, true);
      return;
    }

    // Desmarcar: pede confirmação antes
    setExpenseParaDesmarcar(expense);
  };

  const handleConfirmarDesmarcar = async () => {
    if (!expenseParaDesmarcar) return;
    await executarTogglePaga(expenseParaDesmarcar, false);
    setExpenseParaDesmarcar(null);
  };

  const subtitleTabela =
    selectedDay === null
      ? 'Compras deste mês, mais qualquer pendência de meses anteriores que ainda não foi paga por você'
      : undefined;

  return (
    <Layout navbarTitle={`Parte de ${nomePessoa}`}>
      <div className="space-y-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Erro ao carregar gastos:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Card: mostra a data de hoje + à vista devido + parcelas devidas (separados) + já pago (vitalício) */}
        <div className="rounded-lg p-6 text-white shadow-lg bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold opacity-95">💳 Falta Pagar — {nomePessoa}</h3>
            <span className="text-3xl">🧾</span>
          </div>
          <p className="text-xs opacity-60 mt-1 capitalize">{formatDataCompleta(agora)}</p>

          {carregando || !resumo ? (
            <div className="text-2xl font-bold mt-6 animate-pulse">Carregando...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg px-4 py-3">
                  <p className="text-xs opacity-70">🛒 À vista devido</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(resumo.devidoAvista)}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-3">
                  <p className="text-xs opacity-70">📅 Parcelas devidas</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(resumo.devidoParcelas)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm opacity-90 border-t border-white/10 pt-3">
                <span>Total devido: {formatCurrency(resumo.devidoNoMes)}</span>
                <span>Já pago (total): {formatCurrency(resumo.pagoTotal)}</span>
              </div>
              <button
                onClick={() => setMostrarDetalhamento((prev) => !prev)}
                className="mt-4 text-xs font-semibold text-blue-300 hover:text-blue-200 underline"
              >
                {mostrarDetalhamento ? 'Ocultar detalhamento ▲' : 'Ver detalhamento do valor devido ▼'}
              </button>
            </>
          )}
        </div>

        {/* Detalhamento temporário: lista cada item que compõe o "devido no mês",
            para conferência. Pode ser removido depois que o valor for validado. */}
        {mostrarDetalhamento && resumo && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h4 className="font-bold text-gray-700 text-sm">
                🔍 Detalhamento — {resumo.itensDevidos.length}{' '}
                {resumo.itensDevidos.length === 1 ? 'item' : 'itens'} somando{' '}
                {formatCurrency(resumo.devidoNoMes)}
              </h4>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {resumo.itensDevidos.length === 0 ? (
                <p className="text-sm text-gray-500 px-5 py-4">Nenhum item em aberto.</p>
              ) : (
                resumo.itensDevidos.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex items-center justify-between px-5 py-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-800">{item.local}</span>
                      <span className="text-gray-500 ml-2">({item.descricao})</span>
                    </div>
                    <span className="font-semibold text-gray-700">{formatCurrency(item.valor)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Botão de acesso às anotações privadas desta pessoa */}
        <Link
          to={`/notas/${nomePessoa.toLowerCase()}`}
          className={`flex items-center justify-center gap-2 w-full rounded-lg py-3 font-semibold shadow-sm border-2 transition-colors ${
            corDestaque === 'blue'
              ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
              : 'border-pink-200 text-pink-700 hover:bg-pink-50'
          }`}
        >
          📝 Minhas Anotações
        </Link>

        {/* Seletor de mês/dia: só filtra a tabela abaixo */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={`${selectedMes.ano}-${selectedMes.mes}`}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-white"
          >
            {opcoesMeses.map((m) => (
              <option key={mesRefKey(m)} value={`${m.ano}-${m.mes}`}>
                {NOMES_MES[m.mes]} de {m.ano}
              </option>
            ))}
          </select>

          <select
            value={selectedDay ?? ''}
            onChange={(e) => setSelectedDay(e.target.value === '' ? null : Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-white"
          >
            <option value="">Todos os dias</option>
            {Array.from({ length: totalDiasNoMes }, (_, i) => i + 1).map((dia) => (
              <option key={dia} value={dia}>
                Dia {dia}
              </option>
            ))}
          </select>
        </div>

        <Card title="📋 Compras do período selecionado" subtitle={subtitleTabela}>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Carregando gastos...</p>
            </div>
          ) : expensesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Nenhuma compra neste período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-5 py-4 text-left font-bold text-gray-700">Local</th>
                    <th className="px-5 py-4 text-left font-bold text-gray-700">Valor Total</th>
                    <th className="px-5 py-4 text-left font-bold text-gray-700">
                      Parte de {nomePessoa}
                    </th>
                    <th className="px-5 py-4 text-left font-bold text-gray-700">Comprado por</th>
                    <th className="px-5 py-4 text-left font-bold text-gray-700">Data/Hora</th>
                    <th className="px-5 py-4 text-left font-bold text-gray-700">Pagamento</th>
                    <th className="px-5 py-4 text-center font-bold text-gray-700">
                      Paga ({nomePessoa})
                    </th>
                    <th className="px-5 py-4 text-center font-bold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesFiltrados.map((expense, idx) => {
                    const isParcelado = expense.forma_pagamento === 'parcelado';
                    const isExpanded = expandedId === expense.id;
                    const isToggling = togglingId === expense.id;
                    const pagaPorMim = pagaPelaPessoa(expense);
                    const dataPagamento = dataPagamentoDaPessoa(expense);
                    const arrastada = isArrastada(expense);

                    const rowClasses = pagaPorMim
                      ? 'bg-green-700'
                      : arrastada
                      ? 'bg-amber-50 hover:bg-amber-100'
                      : idx % 2 === 0
                      ? 'bg-white hover:bg-blue-50'
                      : 'bg-gray-50 hover:bg-blue-50';

                    const textPrimary = pagaPorMim ? 'text-white' : 'text-gray-800';
                    const textSecondary = pagaPorMim ? 'text-green-50' : 'text-gray-600';
                    const textParte = pagaPorMim
                      ? 'text-white'
                      : corDestaque === 'blue'
                      ? 'text-blue-600'
                      : 'text-pink-600';

                    return (
                      <React.Fragment key={expense.id}>
                        <tr className={`border-b border-gray-200 transition-colors ${rowClasses}`}>
                          <td className={`px-5 py-4 font-medium ${textPrimary}`}>
                            {expense.local}
                            {arrastada && !pagaPorMim && (
                              <span className="ml-2 inline-block text-[10px] font-semibold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full align-middle whitespace-nowrap">
                                ⏳ Pendente desde {rotuloMesOrigem(expense)}
                              </span>
                            )}
                          </td>
                          <td className={`px-5 py-4 ${textSecondary}`}>{formatCurrency(expense.valor)}</td>
                          <td className={`px-5 py-4 font-bold ${textParte}`}>
                            {formatCurrency(expense.valor / 2)}
                          </td>
                          <td className={`px-5 py-4 ${textSecondary}`}>{expense.responsavel}</td>
                          <td className={`px-5 py-4 ${textSecondary}`}>{formatDateTime(expense.data_compra)}</td>
                          <td className={`px-5 py-4 ${textSecondary}`}>
                            <div className="flex items-center gap-2">
                              <span>{formatPaymentMethod(expense.forma_pagamento, expense.numero_parcelas)}</span>
                              {isParcelado && (
                                <button
                                  onClick={() => toggleExpand(expense.id)}
                                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                                    pagaPorMim
                                      ? 'text-white hover:bg-green-800'
                                      : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                                  }`}
                                >
                                  {isExpanded ? 'Ocultar parcelas ▲' : 'Ver parcelas ▼'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleTogglePaga(expense)}
                                disabled={isToggling}
                                title={pagaPorMim ? 'Marcar como não paga' : 'Marcar como paga'}
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors mx-auto disabled:opacity-50 ${
                                  pagaPorMim
                                    ? 'bg-green-900 border-green-900 text-white'
                                    : 'bg-white border-gray-300 text-transparent hover:border-green-400'
                                }`}
                              >
                                {isToggling ? '⏳' : '✓'}
                              </button>
                              {pagaPorMim && dataPagamento && (
                                <span className={`text-[10px] ${textSecondary}`}>
                                  em {formatDateTime(dataPagamento)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => setEditingExpense(expense)}
                              title="Editar compra"
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm transition-colors mx-auto ${
                                pagaPorMim
                                  ? 'border-white/60 text-white hover:bg-green-800'
                                  : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                              }`}
                            >
                              ✏️
                            </button>
                          </td>
                        </tr>
                        {isParcelado && isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={8} className="px-5">
                              <InstallmentsPanel
                                gastoId={expense.id}
                                pessoa={nomePessoa}
                                onParcelaToggled={updateParcelaLocal}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <EditExpenseModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={editExpense}
      />

      <ConfirmDialog
        isOpen={expenseParaDesmarcar !== null}
        title="Desmarcar compra como paga?"
        message={
          expenseParaDesmarcar
            ? `Você está prestes a desmarcar "${expenseParaDesmarcar.local}" como paga. A data de pagamento registrada será apagada.`
            : ''
        }
        confirmLabel="Desmarcar"
        isLoading={togglingId === expenseParaDesmarcar?.id}
        onConfirm={handleConfirmarDesmarcar}
        onCancel={() => setExpenseParaDesmarcar(null)}
      />
    </Layout>
  );
};