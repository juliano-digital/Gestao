/**
 * Funções auxiliares para formatação de moeda, datas e outros valores
 */

/**
 * Formata um número como moeda em Real (BRL)
 * @param valor - Valor numérico a formatar
 * @returns String formatada como moeda (ex: "R$ 1.234,56")
 */
export const formatCurrency = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

/**
 * Converte uma string formatada como moeda brasileira (ex: "1.234,56") para número
 * @param formatted - String no formato brasileiro
 * @returns Número correspondente, ou NaN se inválido
 */
export const parseCurrencyToNumber = (formatted: string): number => {
  if (!formatted) return NaN;
  const clean = formatted.replace(/\./g, '').replace(',', '.');
  return Number(clean);
};

/**
 * Formata dígitos digitados (sem pontuação) como moeda brasileira,
 * tratando os últimos 2 dígitos como centavos (ex: "111" -> "1,11")
 * @param rawValue - Valor bruto do input (pode conter qualquer caractere)
 * @returns String formatada como moeda (ex: "1,11", "111,11")
 */
export const formatCurrencyInput = (rawValue: string): string => {
  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';
  const number = Number(digits) / 100;
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formata um timestamp (ISO com hora) para data e hora no padrão brasileiro
 * @param timestamp - Data/hora em formato ISO (ex: "2026-08-16T14:32:00+00:00")
 * @returns String formatada (ex: "16/08/2026 às 14:32")
 */
export const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const dataFormatada = new Intl.DateTimeFormat('pt-BR').format(date);
  const horaFormatada = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return `${dataFormatada} às ${horaFormatada}`;
};

/**
 * Formata forma de pagamento para exibição
 * @param formaPagamento - 'a_vista' ou 'parcelado'
 * @param numeroParcelas - Número de parcelas (opcional)
 * @returns String formatada (ex: "À vista" ou "Parcelado em 3x")
 */
export const formatPaymentMethod = (
  formaPagamento: string,
  numeroParcelas?: number
): string => {
  if (formaPagamento === 'a_vista') {
    return 'À vista';
  }

  if (formaPagamento === 'parcelado' && numeroParcelas) {
    return `Parcelado em ${numeroParcelas}x`;
  }

  return 'Parcelado';
};