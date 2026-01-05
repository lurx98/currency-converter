'use client';

import { useState, useMemo, useEffect } from 'react';

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  flag: string;
};

// 默认货币列表（作为后备）
const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'CNY', name: '人民币', symbol: '¥', flag: 'CN' },
  { code: 'HKD', name: '港币', symbol: 'HK$', flag: 'HK' },
  { code: 'USD', name: '美元', symbol: '$', flag: 'US' },
  { code: 'EUR', name: '欧元', symbol: '€', flag: 'EU' },
  { code: 'GBP', name: '英镑', symbol: '£', flag: 'GB' },
  { code: 'JPY', name: '日元', symbol: '¥', flag: 'JP' },
  { code: 'KRW', name: '韩元', symbol: '₩', flag: 'KR' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', flag: 'SG' },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: 'AU' },
  { code: 'CAD', name: '加元', symbol: 'C$', flag: 'CA' },
];

// 货币代码到国旗代码的映射
const CURRENCY_TO_FLAG: { [key: string]: string } = {
  'AED': 'AE', 'AUD': 'AU', 'BGN': 'BG', 'BRL': 'BR', 'CAD': 'CA',
  'CHF': 'CH', 'CNY': 'CN', 'CZK': 'CZ', 'DKK': 'DK', 'EUR': 'EU',
  'GBP': 'GB', 'HKD': 'HK', 'HUF': 'HU', 'IDR': 'ID', 'ILS': 'IL',
  'INR': 'IN', 'JPY': 'JP', 'KRW': 'KR', 'MXN': 'MX', 'MYR': 'MY',
  'NOK': 'NO', 'NZD': 'NZ', 'PHP': 'PH', 'PLN': 'PL', 'RON': 'RO',
  'RUB': 'RU', 'SAR': 'SA', 'SEK': 'SE', 'SGD': 'SG', 'THB': 'TH',
  'TRY': 'TR', 'TWD': 'TW', 'USD': 'US', 'VND': 'VN', 'ZAR': 'ZA',
};

// 货币符号映射
const CURRENCY_SYMBOLS: { [key: string]: string } = {
  'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
  'KRW': '₩', 'INR': '₹', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R',
  'THB': '฿', 'VND': '₫', 'PHP': '₱', 'CHF': 'CHF', 'CAD': 'C$',
  'AUD': 'A$', 'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$', 'TWD': 'NT$',
  'MXN': 'MX$', 'IDR': 'Rp', 'MYR': 'RM', 'AED': 'AED', 'SAR': 'SAR',
};

// 货币中文名称映射
const CURRENCY_NAMES_CN: { [key: string]: string } = {
  'AED': '阿联酋迪拉姆',
  'AFN': '阿富汗尼',
  'ALL': '阿尔巴尼亚列克',
  'AMD': '亚美尼亚德拉姆',
  'ANG': '荷属安的列斯盾',
  'AOA': '安哥拉宽扎',
  'ARS': '阿根廷比索',
  'AUD': '澳元',
  'AWG': '阿鲁巴弗罗林',
  'AZN': '阿塞拜疆马纳特',
  'BAM': '波黑可兑换马克',
  'BBD': '巴巴多斯元',
  'BDT': '孟加拉塔卡',
  'BGN': '保加利亚列弗',
  'BHD': '巴林第纳尔',
  'BIF': '布隆迪法郎',
  'BMD': '百慕大元',
  'BND': '文莱元',
  'BOB': '玻利维亚诺',
  'BRL': '巴西雷亚尔',
  'BSD': '巴哈马元',
  'BTN': '不丹努尔特鲁姆',
  'BWP': '博茨瓦纳普拉',
  'BYN': '白俄罗斯卢布',
  'BZD': '伯利兹元',
  'CAD': '加元',
  'CDF': '刚果法郎',
  'CHF': '瑞士法郎',
  'CLP': '智利比索',
  'CNY': '人民币',
  'COP': '哥伦比亚比索',
  'CRC': '哥斯达黎加科朗',
  'CUP': '古巴比索',
  'CVE': '佛得角埃斯库多',
  'CZK': '捷克克朗',
  'DJF': '吉布提法郎',
  'DKK': '丹麦克朗',
  'DOP': '多米尼加比索',
  'DZD': '阿尔及利亚第纳尔',
  'EGP': '埃及镑',
  'ERN': '厄立特里亚纳克法',
  'ETB': '埃塞俄比亚比尔',
  'EUR': '欧元',
  'FJD': '斐济元',
  'FKP': '福克兰镑',
  'FOK': '法罗群岛克朗',
  'GBP': '英镑',
  'GEL': '格鲁吉亚拉里',
  'GGP': '根西岛镑',
  'GHS': '加纳塞地',
  'GIP': '直布罗陀镑',
  'GMD': '冈比亚达拉西',
  'GNF': '几内亚法郎',
  'GTQ': '危地马拉格查尔',
  'GYD': '圭亚那元',
  'HKD': '港币',
  'HNL': '洪都拉斯伦皮拉',
  'HRK': '克罗地亚库纳',
  'HTG': '海地古德',
  'HUF': '匈牙利福林',
  'IDR': '印尼盾',
  'ILS': '以色列新谢克尔',
  'IMP': '马恩岛镑',
  'INR': '印度卢比',
  'IQD': '伊拉克第纳尔',
  'IRR': '伊朗里亚尔',
  'ISK': '冰岛克朗',
  'JEP': '泽西岛镑',
  'JMD': '牙买加元',
  'JOD': '约旦第纳尔',
  'JPY': '日元',
  'KES': '肯尼亚先令',
  'KGS': '吉尔吉斯斯坦索姆',
  'KHR': '柬埔寨瑞尔',
  'KID': '基里巴斯元',
  'KMF': '科摩罗法郎',
  'KRW': '韩元',
  'KWD': '科威特第纳尔',
  'KYD': '开曼元',
  'KZT': '哈萨克斯坦坚戈',
  'LAK': '老挝基普',
  'LBP': '黎巴嫩镑',
  'LKR': '斯里兰卡卢比',
  'LRD': '利比里亚元',
  'LSL': '莱索托洛蒂',
  'LYD': '利比亚第纳尔',
  'MAD': '摩洛哥迪拉姆',
  'MDL': '摩尔多瓦列伊',
  'MGA': '马达加斯加阿里亚里',
  'MKD': '马其顿第纳尔',
  'MMK': '缅甸元',
  'MNT': '蒙古图格里克',
  'MOP': '澳门元',
  'MRU': '毛里塔尼亚乌吉亚',
  'MUR': '毛里求斯卢比',
  'MVR': '马尔代夫拉菲亚',
  'MWK': '马拉维克瓦查',
  'MXN': '墨西哥比索',
  'MYR': '马来西亚林吉特',
  'MZN': '莫桑比克梅蒂卡尔',
  'NAD': '纳米比亚元',
  'NGN': '尼日利亚奈拉',
  'NIO': '尼加拉瓜科多巴',
  'NOK': '挪威克朗',
  'NPR': '尼泊尔卢比',
  'NZD': '新西兰元',
  'OMR': '阿曼里亚尔',
  'PAB': '巴拿马巴波亚',
  'PEN': '秘鲁索尔',
  'PGK': '巴布亚新几内亚基那',
  'PHP': '菲律宾比索',
  'PKR': '巴基斯坦卢比',
  'PLN': '波兰兹罗提',
  'PYG': '巴拉圭瓜拉尼',
  'QAR': '卡塔尔里亚尔',
  'RON': '罗马尼亚列伊',
  'RSD': '塞尔维亚第纳尔',
  'RUB': '俄罗斯卢布',
  'RWF': '卢旺达法郎',
  'SAR': '沙特里亚尔',
  'SBD': '所罗门群岛元',
  'SCR': '塞舌尔卢比',
  'SDG': '苏丹镑',
  'SEK': '瑞典克朗',
  'SGD': '新加坡元',
  'SHP': '圣赫勒拿镑',
  'SLL': '塞拉利昂利昂',
  'SOS': '索马里先令',
  'SRD': '苏里南元',
  'SSP': '南苏丹镑',
  'STN': '圣多美和普林西比多布拉',
  'SYP': '叙利亚镑',
  'SZL': '斯威士兰里兰吉尼',
  'THB': '泰铢',
  'TJS': '塔吉克斯坦索莫尼',
  'TMT': '土库曼斯坦马纳特',
  'TND': '突尼斯第纳尔',
  'TOP': '汤加潘加',
  'TRY': '土耳其里拉',
  'TTD': '特立尼达和多巴哥元',
  'TVD': '图瓦卢元',
  'TWD': '新台币',
  'TZS': '坦桑尼亚先令',
  'UAH': '乌克兰格里夫纳',
  'UGX': '乌干达先令',
  'USD': '美元',
  'UYU': '乌拉圭比索',
  'UZS': '乌兹别克斯坦索姆',
  'VES': '委内瑞拉玻利瓦尔',
  'VND': '越南盾',
  'VUV': '瓦努阿图瓦图',
  'WST': '萨摩亚塔拉',
  'XAF': '中非法郎',
  'XCD': '东加勒比元',
  'XDR': '特别提款权',
  'XOF': '西非法郎',
  'XPF': '太平洋法郎',
  'YER': '也门里亚尔',
  'ZAR': '南非兰特',
  'ZMW': '赞比亚克瓦查',
  'ZWL': '津巴布韦元',
};

export let ALL_CURRENCIES: Currency[] = DEFAULT_CURRENCIES;

interface CurrencySelectorProps {
  selectedCurrencies: string[];
  onCurrenciesChange: (currencies: string[]) => void;
  onCurrenciesLoaded?: (currencies: Currency[]) => void;
  maxSelection?: number;
}

export default function CurrencySelector({
  selectedCurrencies,
  onCurrenciesChange,
  onCurrenciesLoaded,
  maxSelection = 6,
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [loading, setLoading] = useState(false);

  // 获取 Wise 支持的货币列表
  useEffect(() => {
    const fetchCurrencies = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/currencies');
        if (!response.ok) {
          throw new Error('Failed to fetch currencies');
        }
        const data = await response.json();
        
        if (data.currencies && Array.isArray(data.currencies)) {
          const currencyList: Currency[] = data.currencies.map((curr: any) => ({
            code: curr.code || curr.currency,
            name: CURRENCY_NAMES_CN[curr.code] || curr.name || curr.code,
            symbol: CURRENCY_SYMBOLS[curr.code] || curr.symbol || curr.code,
            flag: CURRENCY_TO_FLAG[curr.code] || curr.code.substring(0, 2),
          }));
          
          setCurrencies(currencyList);
          ALL_CURRENCIES = currencyList;
          // 通知父组件货币列表已加载
          onCurrenciesLoaded?.(currencyList);
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
        // 使用默认货币列表
        setCurrencies(DEFAULT_CURRENCIES);
        onCurrenciesLoaded?.(DEFAULT_CURRENCIES);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, [onCurrenciesLoaded]);

  const selectedCurrencyObjects = useMemo(
    () => currencies.filter(c => selectedCurrencies.includes(c.code)),
    [selectedCurrencies, currencies]
  );

  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return currencies.filter(
      currency =>
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query)
    );
  }, [searchQuery, currencies]);

  const toggleCurrency = (code: string) => {
    if (selectedCurrencies.includes(code)) {
      // 至少保留一个货币
      if (selectedCurrencies.length > 1) {
        onCurrenciesChange(selectedCurrencies.filter(c => c !== code));
      }
    } else {
      // 检查是否达到最大选择数量
      if (selectedCurrencies.length < maxSelection) {
        onCurrenciesChange([...selectedCurrencies, code]);
      }
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md mb-3 sm:mb-4"
      >
        {/* <span className="text-base">⚙️</span> */}
        <span className="font-medium text-sm">选择货币</span>
        <span className="bg-white text-indigo-600 text-xs px-2 py-0.5 rounded-full font-semibold">
          {selectedCurrencies.length}
        </span>
      </button>

      {/* 弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
            {/* 头部 */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">选择货币</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              {/* 搜索框 */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索货币..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
              
              <p className="text-xs text-gray-500 mt-2">
                已选择 {selectedCurrencies.length}/{maxSelection} 种货币
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
                      {selectedCurrencies.length > 1 && (
                        <button
                          onClick={() => toggleCurrency(currency.code)}
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
                    const isSelected = selectedCurrencies.includes(currency.code);
                    const isDisabled = !isSelected && selectedCurrencies.length >= maxSelection;

                    return (
                      <button
                        key={currency.code}
                        onClick={() => !isDisabled && toggleCurrency(currency.code)}
                        disabled={isDisabled}
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
                onClick={() => setIsOpen(false)}
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
