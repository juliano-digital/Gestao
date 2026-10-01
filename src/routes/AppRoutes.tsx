/**
 * Configuração de Rotas da Aplicação
 * Define todos os paths e componentes de páginas
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { NewExpense } from '../pages/NewExpense';
import { PersonExpenses } from '../pages/PersonExpenses';
import { PersonNotes } from '../pages/PersonNotes';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      
      <Route path="/" element={<Dashboard />} />
      <Route path="/novo-gasto" element={<NewExpense />} />
      <Route path="/gastos/:pessoa" element={<PersonExpenses />} />
      <Route path="/notas/:pessoa" element={<PersonNotes />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
};