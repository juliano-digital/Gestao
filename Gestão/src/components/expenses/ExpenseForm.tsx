/**
 * Componente ExpenseForm - Formulário para cadastro/edição de gastos
 * Utiliza React Hook Form para validação e Zod para type safety
 * A data/hora da compra é preenchida automaticamente pelo banco (não faz parte do formulário)
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, Card } from '../ui';
import { formatCurrencyInput, parseCurrencyToNumber } from '../../utils/formatCurrency';
import type { ExpenseFormData } from '../../types/expense';

// Schema de validação com Zod
const expenseSchema = z
  .object({
    local: z.string().min(1, 'Local é obrigatório').min(3, 'Local deve ter pelo menos 3 caracteres'),
    valor: z.string().refine(
      (val) => {
        const n = parseCurrencyToNumber(val);
        return !isNaN(n) && n > 0;
      },
      { message: 'Valor deve ser maior que zero' }
    ),
    forma_pagamento: z
      .union([z.literal('a_vista'), z.literal('parcelado'), z.literal('')])
      .refine((val) => val === 'a_vista' || val === 'parcelado', {
        message: 'Selecione uma forma de pagamento',
      }),
    numero_parcelas: z.string().optional(),
    responsavel: z
      .union([z.literal('Juliano'), z.literal('Lidiane'), z.literal('')])
      .refine((val) => val === 'Juliano' || val === 'Lidiane', {
        message: 'Selecione o responsável',
      }),
  })
  .refine(
    (data) => {
      if (data.forma_pagamento === 'parcelado') {
        const n = Number(data.numero_parcelas);
        return !isNaN(n) && n >= 2;
      }
      return true;
    },
    {
      message: 'Informe o número de parcelas (mínimo 2)',
      path: ['numero_parcelas'],
    }
  );

type ExpenseFormSchemaType = z.input<typeof expenseSchema>;

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  initialData?: ExpenseFormData;
  isLoading?: boolean;
}

/**
 * Formulário para criar ou editar um gasto
 * @param onSubmit - Função chamada ao enviar o formulário
 * @param initialData - Dados iniciais (para edição)
 * @param isLoading - Mostra estado de carregamento
 */
export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const defaultValues: ExpenseFormSchemaType = initialData
    ? {
        local: initialData.local,
        valor: initialData.valor.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        forma_pagamento: initialData.forma_pagamento,
        numero_parcelas: initialData.numero_parcelas?.toString() || '',
        responsavel: initialData.responsavel as 'Juliano' | 'Lidiane',
      }
    : {
        local: '',
        valor: '',
        forma_pagamento: '',
        numero_parcelas: '',
        responsavel: '',
      };

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });

  const formaPagamento = watch('forma_pagamento');

  const handleFormSubmit = async (data: ExpenseFormSchemaType) => {
    try {
      const expenseData: ExpenseFormData = {
        local: data.local,
        valor: parseCurrencyToNumber(data.valor),
        forma_pagamento: data.forma_pagamento as 'a_vista' | 'parcelado',
        numero_parcelas:
          data.forma_pagamento === 'parcelado' ? Number(data.numero_parcelas || 0) : undefined,
        responsavel: data.responsavel,
      };

      await onSubmit(expenseData);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    }
  };

  return (
    <Card title="💳 Registrar Novo Gasto" subtitle="Preencha os dados abaixo para adicionar um novo gasto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Local */}
        <Controller
          name="local"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Local da Compra"
              placeholder="Ex: Supermercado, Farmácia, Restaurante"
              error={errors.local?.message}
            />
          )}
        />

        {/* Valor - com preenchimento inteligente estilo moeda */}
        <Controller
          name="valor"
          control={control}
          render={({ field }) => (
            <Input
              label="Valor Gasto (R$)"
              inputMode="decimal"
              placeholder="0,00"
              value={field.value}
              onChange={(e) => {
                const formatted = formatCurrencyInput(e.target.value);
                field.onChange(formatted);
              }}
              onBlur={field.onBlur}
              error={errors.valor?.message}
            />
          )}
        />

        {/* Forma de Pagamento */}
        <Controller
          name="forma_pagamento"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Forma de Pagamento"
              placeholder="Selecione a forma de pagamento"
              options={[
                { value: 'a_vista', label: '💵 À Vista' },
                { value: 'parcelado', label: '📊 Parcelado' },
              ]}
              error={errors.forma_pagamento?.message}
            />
          )}
        />

        {/* Número de Parcelas (condicional) */}
        {formaPagamento === 'parcelado' && (
          <Controller
            name="numero_parcelas"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Número de Parcelas"
                type="number"
                min="2"
                max="48"
                placeholder="Ex: 3"
                error={errors.numero_parcelas?.message}
              />
            )}
          />
        )}

        {/* Responsável - seleção fixa entre os dois usuários do app */}
        <Controller
          name="responsavel"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Responsável pela Compra"
              placeholder="Selecione quem fez a compra"
              options={[
                { value: 'Juliano', label: 'Juliano' },
                { value: 'Lidiane', label: 'Lidiane' },
              ]}
              error={errors.responsavel?.message}
            />
          )}
        />

        {/* Botão de Envio */}
        <div className="flex gap-4">
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
            {initialData ? 'Atualizar Gasto' : 'Salvar Gasto'}
          </Button>
          <Button type="reset" variant="outline" size="lg">
            Limpar
          </Button>
        </div>
      </form>
    </Card>
  );
};