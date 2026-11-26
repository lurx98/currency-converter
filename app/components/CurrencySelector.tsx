'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Currency } from '@/lib/currencies';

interface CurrencySelectorProps {
  currencies: readonly Currency[];
  loading: boolean;
  selectedCodes: readonly string[];
  onChange: (codes: string[]) => void;
  maxSelection: number;
}

export default function CurrencySelector({
  currencies,
  loading,
  selectedCodes,
  onChange,
  maxSelection,
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  // 打开时聚焦搜索框，按 Esc 关闭，关闭后把焦点还给触发按钮
  useEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    searchRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [isOpen]);

  const selectedCurrencyObjects = useMemo(
    () => selectedCodes
      .map(code => currencies.find(c => c.code === code))
      .filter((currency): currency is Currency => currency !== undefined),
    [selectedCodes, currencies]
  );

  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return currencies.filter(
      currency =>
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query)
    );
  }, [searchQuery, currencies]);

  const toggleCurrency = (code: string) => {
    if (selectedCodes.includes(code)) {
      // 至少保留一个货币
      if (selectedCodes.length > 1) {
        onChange(selectedCodes.filter(c => c !== code));
      }
    } else if (selectedCodes.length < maxSelection) {
      onChange([...selectedCodes, code]);
    }
  };

  const close = () => setIsOpen(false);

  return (
    <>
      {/* 触发按钮 */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md mb-3 sm:mb-4"
      >
        <span className="font-medium text-sm">选择货币</span>
        <span className="bg-white text-indigo-600 text-xs px-2 py-0.5 rounded-full font-semibold">
          {selectedCodes.length}
        </span>
      </button>

      {/* 弹窗 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
          >
            {/* 头部 */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 id={titleId} className="text-xl font-bold text-gray-800">选择货币</h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="关闭"
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* 搜索框 */}
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索货币..."
                aria-label="搜索货币"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <p className="text-xs text-gray-500 mt-2">
                已选择 {selectedCodes.length}/{maxSelection} 种货币
              </p>
            </div>

            {/* 已选择的货币 */}
            {selectedCurrencyObjects.length > 0 && (
              <div className="p-4 bg-gray-50 border-b">
                <div className="text-xs text-gray-600 mb-2 font-medium">已选择</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCurrencyObjects.map(currency => (
                    <div
                      key={currency.code}
                      className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm"
                    >
                      <span className="font-bold">{currency.flag}</span>
                      <span>{currency.code}</span>
                      {selectedCodes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => toggleCurrency(currency.code)}
                          aria-label={`移除 ${currency.name}`}
                          className="ml-1 hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 货币列表 */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-sm">加载货币列表...</p>
                </div>
              ) : filteredCurrencies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">未找到匹配的货币</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCurrencies.map(currency => {
                    const isSelected = selectedCodes.includes(currency.code);
                    const isDisabled = !isSelected && selectedCodes.length >= maxSelection;

                    return (
                      <button
                        key={currency.code}
                        type="button"
                        onClick={() => toggleCurrency(currency.code)}
                        disabled={isDisabled}
                        aria-pressed={isSelected}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-2 border-indigo-500'
                            : isDisabled
                            ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl font-bold shadow-sm">
                            {currency.flag}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-gray-800">
                              {currency.code}
                            </div>
                            <div className="text-xs text-gray-500">
                              {currency.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{currency.symbol}</span>
                          {isSelected && (
                            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm">
                              ✓
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="p-4 border-t">
              <button
                type="button"
                onClick={close}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
