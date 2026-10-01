/**
 * SQL para criar a tabela "gastos" no Supabase (PostgreSQL)
 * 
 * Execute este SQL no Supabase SQL Editor para criar a tabela necessária
 * para o aplicativo de controle de gastos.
 */

-- Criar tabela de gastos
CREATE TABLE gastos (
  -- ID único do gasto (UUID)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Local onde a compra foi feita
  local TEXT NOT NULL,
  
  -- Valor gasto (usando numeric para precisão de moeda)
  valor NUMERIC NOT NULL CHECK (valor > 0),
  
  -- Forma de pagamento: 'a_vista' ou 'parcelado'
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('a_vista', 'parcelado')),
  
  -- Número de parcelas (NULL se for à vista, obrigatório se for parcelado)
  numero_parcelas INTEGER CHECK (
    (forma_pagamento = 'a_vista' AND numero_parcelas IS NULL) OR
    (forma_pagamento = 'parcelado' AND numero_parcelas >= 2 AND numero_parcelas <= 48)
  ),
  
  -- Data da compra
  data_compra DATE NOT NULL,
  
  -- Responsável pela compra (pessoa que fez a compra)
  responsavel TEXT NOT NULL,
  
  -- Timestamp de criação do registro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamp de última atualização
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance de queries
CREATE INDEX idx_gastos_data_compra ON gastos(data_compra);
CREATE INDEX idx_gastos_responsavel ON gastos(responsavel);
CREATE INDEX idx_gastos_local ON gastos(local);
CREATE INDEX idx_gastos_created_at ON gastos(created_at);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_gastos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gastos_updated_at
BEFORE UPDATE ON gastos
FOR EACH ROW
EXECUTE FUNCTION update_gastos_updated_at();

-- Habilitar Row Level Security para permitir acesso público no MVP
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Política pública para permitir leitura e escrita no MVP
CREATE POLICY "Allow public access to gastos"
  ON gastos
  FOR ALL
  USING (true)
  WITH CHECK (true);
