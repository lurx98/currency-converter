'use client';

import { useState, useEffect, useMemo } from 'react';
import CurrencySelector, { ALL_CURRENCIES } from './components/CurrencySelector';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Rates {
  [key: string]: number;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

interface SortableCurrencyCardProps {
  currency: Currency;
  isSelected: boolean;
  value: string;
  amount: string;
  setAmount: (value: string) => void;
  setSelectedCurrency: (code: string) => void;
  selectedCurrencyCodes: string[];
  getExchangeRate: (code: string) => string;
}

function SortableCurrencyCard({
  currency,
  isSelected,
  value,
  amount,
  setAmount,
  setSelectedCurrency,
  selectedCurrencyCodes,
  getExchangeRate,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl transition-all ${
        isSelected
          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 p-3 sm:p-4'
          : 'bg-gray-50 p-3 sm:p-4 hover:bg-gray-100'
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
        >
          <svg
            className={`w-5 h-5 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
        
        <div
          onClick={() => setSelectedCurrency(currency.code)}
          className="flex items-center gap-2 sm:gap-3 flex-1 cursor-pointer"
        >
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold ${
            isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {currency.flag}
          </div>
          <div>
            <div className={`text-xs sm:text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-600'}`}>
              {currency.name}
            </div>
          </div>
        </div>
      </div>
      
      {isSelected ? (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white rounded-xl text-lg sm:text-xl font-semibold text-gray-800 outline-none"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-lg sm:text-xl text-indigo-500">
            {currency.symbol}
          </span>
        </div>
      ) : (
        <div
          className="relative cursor-pointer"
          onClick={() => setSelectedCurrency(currency.code)}
        >
          <div className="text-xl sm:text-2xl font-bold text-gray-800 py-1">
            {value}
          </div>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg sm:text-xl text-indigo-500 font-semibold">
            {currency.symbol}
          </span>
        </div>
      )}
      
      <div className={`text-xs sm:text-sm mt-1 sm:mt-2 ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
        1 {selectedCurrencyCodes[0]} = {getExchangeRate(currency.code)} {currency.code}
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedCurrencyCodes, setSelectedCurrencyCodes] = useState<string[]>(['CNY', 'HKD', 'USD']);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('CNY');
  const [amount, setAmount] = useState<string>('100');
  const [rates, setRates] = useState<Rates>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // 配置拖拽传感器 - 长按 250ms 后触发拖拽
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currencies = useMemo(
    () => ALL_CURRENCIES.filter(c => selectedCurrencyCodes.includes(c.code))
        .sort((a, b) => selectedCurrencyCodes.indexOf(a.code) - selectedCurrencyCodes.indexOf(b.code)),
    [selectedCurrencyCodes]
  );

  const currencyMap = useMemo(() => {
    const map: { [key: string]: { name: string; symbol: string; flag: string } } = {};
    currencies.forEach(c => {
      map[c.code] = { name: c.name, symbol: c.symbol, flag: c.flag };
    });
    return map;
  }, [currencies]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const baseCurrency = selectedCurrencyCodes[0]; // 使用第一个货币作为基准
      const otherCurrencies = selectedCurrencyCodes.filter(c => c !== baseCurrency);
      
      if (otherCurrencies.length === 0) {
        setRates({});
        setLoading(false);
        return;
      }
      
      const response = await fetch(
        `/api/rates?base=${baseCurrency}&targets=${otherCurrencies.join(',')}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch rates');
      }

      const data = await response.json();
      setRates(data.rates);
      setLastUpdate(new Date().toLocaleTimeString('zh-CN'));
    } catch (error) {
      console.error('Error fetching rates:', error);
      alert('获取汇率失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // 每30秒自动更新一次汇率
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, [selectedCurrencyCodes]);

  // 当选择的货币变化时，确保当前选中的货币仍在列表中
  useEffect(() => {
    if (!selectedCurrencyCodes.includes(selectedCurrency)) {
      setSelectedCurrency(selectedCurrencyCodes[0]);
    }
  }, [selectedCurrencyCodes, selectedCurrency]);

  const calculateConversion = (targetCurrency: string): string => {
    const inputAmount = parseFloat(amount);
    if (isNaN(inputAmount) || inputAmount <= 0) return '0.00';
    
    if (targetCurrency === selectedCurrency) {
      return inputAmount.toFixed(2);
    }

    // 计算相对于基准货币的汇率
    const baseCurrency = selectedCurrencyCodes[0];
    
    if (selectedCurrency === baseCurrency) {
      // 如果选中的是基准货币，直接使用汇率
      const rate = rates[targetCurrency];
      if (!rate) return '加载中...';
      return (inputAmount * rate).toFixed(2);
    } else if (targetCurrency === baseCurrency) {
      // 如果目标是基准货币，使用反向汇率
      const rate = rates[selectedCurrency];
      if (!rate) return '加载中...';
      return (inputAmount / rate).toFixed(2);
    } else {
      // 两个都不是基准货币，需要通过基准货币转换
      const rateFrom = rates[selectedCurrency];
      const rateTo = rates[targetCurrency];
      if (!rateFrom || !rateTo) return '加载中...';
      return (inputAmount / rateFrom * rateTo).toFixed(2);
    }
  };

  const getExchangeRate = (currency: string): string => {
    const baseCurrency = selectedCurrencyCodes[0];
    
    if (currency === baseCurrency) {
      return '1.0000';
    }
    
    const rate = rates[currency];
    if (!rate) return '...';
    
    return rate.toFixed(4);
  };

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedCurrencyCodes((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 py-4 sm:py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6">
          <div className="text-center mb-3 sm:mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl sm:text-3xl">💱</span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                实时汇率计算器
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {loading ? '正在获取汇率...' : lastUpdate && `最后更新: ${lastUpdate}`}
            </p>
          </div>

          {/* 货币选择器 */}
          <CurrencySelector
            selectedCurrencies={selectedCurrencyCodes}
            onCurrenciesChange={setSelectedCurrencyCodes}
            maxSelection={5}
          />

          {/* 提示信息 */}
          <p className="text-xs text-gray-400 text-center mb-2">
            💡 长按左侧拖拽图标可调整货币顺序
          </p>

          {/* 货币选择和输入 - 可拖拽排序 */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currencies.map(c => c.code)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2.5">
                {currencies.map((currency) => {
                  const value = calculateConversion(currency.code);
                  const isSelected = currency.code === selectedCurrency;
                  
                  return (
                    <SortableCurrencyCard
                      key={currency.code}
                      currency={currency}
                      isSelected={isSelected}
                      value={value}
                      amount={amount}
                      setAmount={setAmount}
                      setSelectedCurrency={setSelectedCurrency}
                      selectedCurrencyCodes={selectedCurrencyCodes}
                      getExchangeRate={getExchangeRate}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          {/* 错误提示 */}
          {!loading && Object.keys(rates).length === 0 && (
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs sm:text-sm text-red-600 text-center">
                ✗ 获取汇率失败，请稍后重试（使用参考汇率）
              </p>
            </div>
          )}

          {/* 刷新按钮 */}
          <button
            onClick={fetchRates}
            disabled={loading}
            className="w-full mt-3 sm:mt-4 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base">
            <span className="text-base sm:text-lg">🔄</span>
            {loading ? '更新中...' : '刷新汇率'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-2 sm:mt-3">
            汇率数据由 Wise 提供 · 每30秒自动更新
          </p>
        </div>
      </div>
    </main>
  );
}
