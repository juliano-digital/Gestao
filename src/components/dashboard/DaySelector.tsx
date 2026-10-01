/**
 * Componente DaySelector - dropdown para filtrar por um dia específico
 * dentro do mês selecionado. Opção "Todos os dias" mostra o mês inteiro.
 */
import React from 'react';
import { getAvailableDays, type YearMonth } from '../../utils/dateHelpers';

interface DaySelectorProps {
  month: YearMonth;
  selectedDay: number | null; // null = "Todos os dias"
  onChange: (day: number | null) => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({ month, selectedDay, onChange }) => {
  const days = getAvailableDays(month);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange(value === 'all' ? null : Number(value));
  };

  return (
    <select
      value={selectedDay === null ? 'all' : String(selectedDay)}
      onChange={handleChange}
      className="px-4 py-2 rounded-lg border border-gray-300 bg-white font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
    >
      <option value="all">Todos os dias</option>
      {days.map((day) => (
        <option key={day} value={day}>
          Dia {day}
        </option>
      ))}
    </select>
  );
};