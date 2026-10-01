/**
 * Componente MonthSelector - dropdown para escolher qual mês ver no Dashboard
 * Mostra apenas o nome do mês nas opções (ex: "Agosto")
 */
import React from 'react';
import { formatMonthName, yearMonthKey, type YearMonth } from '../../utils/dateHelpers';

interface MonthSelectorProps {
  availableMonths: YearMonth[];
  selected: YearMonth;
  onChange: (ym: YearMonth) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  availableMonths,
  selected,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = availableMonths.find((ym) => yearMonthKey(ym) === e.target.value);
    if (found) onChange(found);
  };

  return (
    <select
      value={yearMonthKey(selected)}
      onChange={handleChange}
      className="px-4 py-2 rounded-lg border border-gray-300 bg-white font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
    >
      {availableMonths.map((ym) => (
        <option key={yearMonthKey(ym)} value={yearMonthKey(ym)}>
          {formatMonthName(ym)}
        </option>
      ))}
    </select>
  );
};