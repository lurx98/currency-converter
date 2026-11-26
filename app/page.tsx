'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import CurrencySelector from './components/CurrencySelector';
import SortableCurrencyCard from './components/SortableCurrencyCard';
import { useCurrencyList } from './hooks/useCurrencyList';
import { useExchangeRates } from './hooks/useExchangeRates';
import { convert, formatAmount, formatRate, getRate, parseAmount } from '@/lib/conversion';
import { DEFAULT_SELECTED_CODES, MAX_SELECTION, type Currency } from '@/lib/currencies';
import { readPreferences, writePreference } from '@/lib/storage';

const DEFAULT_AMOUNT = '100';
// 长按 250ms 后才触发拖拽，避免与点击、滚动冲突
const DRAG_ACTIVATION = { delay: 250, tolerance: 5 };

export default function Home() {
  const [selectedCodes, setSelectedCodes] = useState<string[]>(() => Array.from(DEFAULT_SELECTED_CODES));
  const [selectedCurrency, setSelectedCurrency] = useState<string>(DEFAULT_SELECTED_CODES[0]);
  const [amount, setAmount] = useState<string>(DEFAULT_AMOUNT);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const {
    currencies: allCurrencies,
    loading: currenciesLoading,
    error: currenciesError,
  } = useCurrencyList();
  const { table, missing, loading, error, lastUpdate, refresh } = useExchangeRates(selectedCodes, prefsLoaded);

  // 客户端挂载后从本地存储恢复设置（只有校验通过的值才会被使用）
  useEffect(() => {
    const prefs = readPreferences();
    if (prefs.codes) setSelectedCodes(prefs.codes);
    if (prefs.amount !== null) setAmount(prefs.amount);
    if (prefs.selected) setSelectedCurrency(prefs.selected);
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (prefsLoaded) writePreference('codes', JSON.stringify(selectedCodes));
  }, [selectedCodes, prefsLoaded]);

  useEffect(() => {
    if (prefsLoaded) writePreference('amount', amount);
  }, [amount, prefsLoaded]);

  useEffect(() => {
    if (prefsLoaded) writePreference('selected', selectedCurrency);
  }, [selectedCurrency, prefsLoaded]);

  // 真实货币列表加载成功后，去掉列表里不存在的货币；用的是后备列表时不处理，避免误删用户设置
  useEffect(() => {
    if (currenciesLoading || currenciesError) return;

    const known = new Set(allCurrencies.map(c => c.code));
    setSelectedCodes(prev => {
      const valid = prev.filter(code => known.has(code));
      if (valid.length === prev.length) return prev;
      return valid.length > 0 ? valid : Array.from(DEFAULT_SELECTED_CODES);
    });
  }, [allCurrencies, currenciesLoading, currenciesError]);

  // 确保当前输入的货币仍在列表中
  useEffect(() => {
    if (!selectedCodes.includes(selectedCurrency)) {
      setSelectedCurrency(selectedCodes[0]);
    }
  }, [selectedCodes, selectedCurrency]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: DRAG_ACTIVATION }),
    useSensor(TouchSensor, { activationConstraint: DRAG_ACTIVATION }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const currencies = useMemo(
    () => selectedCodes
      .map(code => allCurrencies.find(c => c.code === code))
      .filter((currency): currency is Currency => currency !== undefined),
    [selectedCodes, allCurrencies]
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSelectedCodes(prev => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      return oldIndex === -1 || newIndex === -1 ? prev : arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const baseCode = selectedCodes[0];
  const inputAmount = parseAmount(amount);
  const selectedHasNoRate = missing.includes(selectedCurrency);

  const describeValue = (code: string): string => {
    if (inputAmount === null) return formatAmount(0);
    const value = convert(inputAmount, selectedCurrency, code, table);
    if (value !== null) return formatAmount(value);
    return selectedHasNoRate || missing.includes(code) ? '暂无汇率' : '加载中...';
  };

  const describeRate = (code: string): string => {
    const rate = getRate(table, baseCode, code);
    return `1 ${baseCode} = ${rate === null ? '...' : formatRate(rate)} ${code}`;
  };

  const formattedLastUpdate = lastUpdate?.toLocaleTimeString('zh-CN') ?? '';
  const statusText = loading ? '正在获取汇率...' : formattedLastUpdate && `最后更新: ${formattedLastUpdate}`;
  // 只在客户端（读取完本地设置、拿到货币列表后）渲染可拖拽列表，避免 SSR 水合不一致
  const showCards = prefsLoaded && !currenciesLoading && currencies.length > 0;

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
            <p className="text-xs sm:text-sm text-gray-500" aria-live="polite">
              {statusText}
            </p>
          </div>

          {/* 货币选择器 */}
          <CurrencySelector
            currencies={allCurrencies}
            loading={currenciesLoading}
            selectedCodes={selectedCodes}
            onChange={setSelectedCodes}
            maxSelection={MAX_SELECTION}
          />

          {/* 提示信息 */}
          <p className="text-xs text-gray-400 text-center mb-2">
            💡 长按左侧拖拽图标可调整货币顺序
          </p>

          {/* 货币选择和输入 - 可拖拽排序 */}
          {showCards ? (
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
                  {currencies.map(currency => (
                    <SortableCurrencyCard
                      key={currency.code}
                      currency={currency}
                      isSelected={currency.code === selectedCurrency}
                      displayValue={describeValue(currency.code)}
                      amount={amount}
                      rateLabel={describeRate(currency.code)}
                      onAmountChange={setAmount}
                      onSelect={setSelectedCurrency}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
              <p className="text-sm">正在加载货币列表...</p>
            </div>
          )}

          {/* 错误与提示 */}
          {error && (
            <div role="alert" className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs sm:text-sm text-red-600 text-center">
                ✗ {table && formattedLastUpdate
                  ? `汇率更新失败，当前显示的是 ${formattedLastUpdate} 的数据`
                  : error}
              </p>
            </div>
          )}
          {!error && missing.length > 0 && (
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs sm:text-sm text-amber-700 text-center">
                暂时无法获取以下货币的汇率：{missing.join('、')}
              </p>
            </div>
          )}
          {currenciesError && (
            <p className="mt-2 text-xs text-gray-400 text-center">{currenciesError}</p>
          )}

          {/* 刷新按钮 */}
          <button
            type="button"
            onClick={refresh}
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
