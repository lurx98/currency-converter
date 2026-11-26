'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Currency } from '@/lib/currencies';

interface SortableCurrencyCardProps {
  currency: Currency;
  isSelected: boolean;
  displayValue: string;
  amount: string;
  rateLabel: string;
  onAmountChange: (value: string) => void;
  onSelect: (code: string) => void;
}

export default function SortableCurrencyCard({
  currency,
  isSelected,
  displayValue,
  amount,
  rateLabel,
  onAmountChange,
  onSelect,
}: SortableCurrencyCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: currency.code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const select = () => onSelect(currency.code);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl transition-all select-none p-3 sm:p-4 ${
        isSelected
          ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
          : 'bg-gray-50 hover:bg-gray-100'
      } ${isDragging ? 'shadow-2xl scale-105' : ''}`}
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 rounded ${
            isSelected ? 'hover:bg-white/10' : 'hover:bg-gray-200'
          }`}
          title="长按拖拽排序"
          aria-label={`拖拽调整 ${currency.name} 的顺序`}
        >
          <svg
            className={`w-5 h-5 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        <button
          type="button"
          onClick={select}
          className="flex items-center gap-2 sm:gap-3 flex-1 text-left"
        >
          <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold ${
            isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {currency.flag}
          </span>
          <span className={`text-xs sm:text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-600'}`}>
            {currency.name}
          </span>
        </button>
      </div>

      {isSelected ? (
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white rounded-xl text-lg sm:text-xl font-semibold text-gray-800 outline-none"
            placeholder="0.00"
            min="0"
            step="0.01"
            aria-label={`${currency.name}金额`}
          />
          <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-lg sm:text-xl text-indigo-500">
            {currency.symbol}
          </span>
        </div>
      ) : (
        <button type="button" onClick={select} className="relative w-full text-left">
          <span className="block text-xl sm:text-2xl font-bold text-gray-800 py-1">
            {displayValue}
          </span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg sm:text-xl text-indigo-500 font-semibold">
            {currency.symbol}
          </span>
        </button>
      )}

      <div className={`text-xs sm:text-sm mt-1 sm:mt-2 ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
        {rateLabel}
      </div>
    </div>
  );
}
