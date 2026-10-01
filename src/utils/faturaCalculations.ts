/**
 * Cálculo do resumo financeiro de uma pessoa (Juliano ou Lidiane).
 *
 * "Devido no mês" é dividido em dois valores separados, para dar controle
 * independente sobre cada tipo de gasto:
 *  - devidoAvista: soma de CADA compra à vista que ainda não foi marcada
 *    como paga por essa pessoa.
 *  - devidoParcelas: soma de CADA parcela que essa pessoa ainda não marcou
 *    como paga (parcela 1, 2, 3, 4... todas, não só a próxima).
 *  - devidoNoMes: soma dos dois acima, mantido para quem ainda usa o total
 *    combinado.
 *
 * Qualquer toggle clicado — parcela (em qualquer ordem) ou à vista — muda
 * o campo correspondente exatamente pelo valor daquele item: marcar como
 * pago subtrai; desmarcar devolve.
 *
 * "Já pago" é um contador VITALÍCIO: soma tudo que essa pessoa já marcou
 * como pago (à vista de qualquer mês + qualquer parcela), independente de
 * quando foi pago.
 *
 * O "pago"/"não pago" é sempre específico de cada pessoa
 * (paga_juliano/paga_lidiane).
 *
 * "itensDevidos": lista detalhada de cada item que está entrando na soma
 * de "devidoNoMes":
 *  - Uma linha por compra à vista em aberto.
 *  - Uma ÚNICA linha por compra PARCELADA em aberto (não uma por parcela),
 *    somando o valor de todas as parcelas ainda não pagas dessa compra, com
 *    a descrição mostrando quantas já foram pagas (ex: "Parcela 4 de 10").
 */

import type { Expense, Parcela } from '../types/expense';

export type Pessoa = 'Juliano' | 'Lidiane';

export interface ItemDevido {
  id: string;
  local: string;
  valor: number;
  descricao: string;
  tipo: 'a_vista' | 'parcela';
}

export interface ResumoAtual {
  /** Soma de cada compra à vista não paga por essa pessoa */
  devidoAvista: number;
  /** Soma de cada parcela não paga por essa pessoa (todas, não só a próxima) */
  devidoParcelas: number;
  /** devidoAvista + devidoParcelas, mantido para uso combinado */
  devidoNoMes: number;
  /** Contador vitalício: tudo que esta pessoa já marcou como pago, de qualquer mês */
  pagoTotal: number;
  /** Detalhamento de cada item somado em devidoNoMes, para conferência */
  itensDevidos: ItemDevido[];
}

/**
 * Converte data_compra (pode vir como "YYYY-MM-DD" simples ou como
 * timestamp completo "YYYY-MM-DDTHH:mm:ss.ssssss+00:00") para uma Date
 * local, usando apenas ano/mês/dia.
 */
export function parseDataLocal(dataStr: string): Date {
  const somenteData = dataStr.split('T')[0];
  const [ano, mes, dia] = somenteData.split('-').map(Number);
  return new Date(ano, (mes || 1) - 1, dia || 1);
}

export function calcularResumoAtual(
  expenses: Expense[],
  parcelas: Parcela[],
  pessoa: Pessoa,
  _hoje: Date = new Date()
): ResumoAtual {
  let devidoAvista = 0;
  let devidoParcelas = 0;
  let pagoTotal = 0;
  const itensDevidos: ItemDevido[] = [];

  const pagoPor = (jaPagouJuliano: boolean, jaPagouLidiane: boolean): boolean =>
    pessoa === 'Juliano' ? jaPagouJuliano : jaPagouLidiane;

  // Compras à vista: cada uma soma no "devidoAvista" se não estiver paga
  // por essa pessoa, ou no "pago" se já estiver — sem filtro de mês.
  for (const expense of expenses) {
    if (expense.forma_pagamento !== 'a_vista') continue;

    const parte = expense.valor / 2;
    if (pagoPor(expense.paga_juliano, expense.paga_lidiane)) {
      pagoTotal += parte;
    } else {
      devidoAvista += parte;
      itensDevidos.push({
        id: expense.id,
        local: expense.local,
        valor: parte,
        descricao: 'À vista',
        tipo: 'a_vista',
      });
    }
  }

  // Agrupa parcelas por compra
  const parcelasPorGasto = new Map<string, Parcela[]>();
  for (const parcela of parcelas) {
    const lista = parcelasPorGasto.get(parcela.gasto_id) ?? [];
    lista.push(parcela);
    parcelasPorGasto.set(parcela.gasto_id, lista);
  }

  // Para cada compra parcelada: soma o valor de TODAS as parcelas em aberto
  // dela (isso é o que garante que qualquer toggle sempre muda o card), mas
  // no detalhamento mostra só UMA linha por compra, com o total ainda devido
  // e quantas parcelas já foram pagas.
  for (const [gastoId, listaDoGasto] of parcelasPorGasto) {
    const gastoRelacionado = expenses.find((e) => e.id === gastoId);
    const totalParcelas = gastoRelacionado?.numero_parcelas ?? listaDoGasto.length;
    const pagasCount = listaDoGasto.filter((p) => pagoPor(p.paga_juliano, p.paga_lidiane)).length;

    let somaNaoPagaDoGasto = 0;
    for (const parcela of listaDoGasto) {
      const parte = parcela.valor_parcela / 2;
      if (pagoPor(parcela.paga_juliano, parcela.paga_lidiane)) {
        pagoTotal += parte;
      } else {
        devidoParcelas += parte;
        somaNaoPagaDoGasto += parte;
      }
    }

    if (somaNaoPagaDoGasto > 0) {
      itensDevidos.push({
        id: gastoId,
        local: gastoRelacionado ? gastoRelacionado.local : 'Compra parcelada',
        valor: somaNaoPagaDoGasto,
        descricao: `Parcela ${pagasCount} de ${totalParcelas}`,
        tipo: 'parcela',
      });
    }
  }

  return {
    devidoAvista,
    devidoParcelas,
    devidoNoMes: devidoAvista + devidoParcelas,
    pagoTotal,
    itensDevidos,
  };
}

/** Retorna { ano, mes } do mês atual (mes 0-indexado) */
export function getMesAnoAtual(hoje: Date = new Date()): { ano: number; mes: number } {
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
}

/**
 * Diz se uma compra ainda está PENDENTE (não totalmente paga) para uma
 * pessoa específica:
 *  - À vista: pendente se essa pessoa ainda não marcou a parte dela como paga.
 *  - Parcelada: pendente se AO MENOS UMA parcela dessa compra ainda não foi
 *    paga por essa pessoa (mesmo que outras parcelas já tenham sido pagas).
 *
 * Usado para "arrastar" compras não pagas para os meses seguintes na
 * tabela de compras de cada pessoa, até que sejam totalmente quitadas —
 * assim ninguém precisa voltar no calendário pra achar uma pendência
 * antiga.
 *
 * Se a compra é parcelada mas as parcelas dela ainda não foram carregadas
 * (lista vazia), retorna false por precaução — evita que a compra "suma"
 * da tabela por engano antes dos dados chegarem do banco.
 */
export function expensePendentePorPessoa(
  expense: Expense,
  parcelas: Parcela[],
  pessoa: Pessoa
): boolean {
  const pendentePor = (jaPagouJuliano: boolean, jaPagouLidiane: boolean): boolean =>
    pessoa === 'Juliano' ? !jaPagouJuliano : !jaPagouLidiane;

  if (expense.forma_pagamento === 'a_vista') {
    return pendentePor(expense.paga_juliano, expense.paga_lidiane);
  }

  const parcelasDoGasto = parcelas.filter((p) => p.gasto_id === expense.id);
  if (parcelasDoGasto.length === 0) return false;

  return parcelasDoGasto.some((p) => pendentePor(p.paga_juliano, p.paga_lidiane));
}