import { isCurrencyCode } from './currencies';

export interface RateTable {
  /** 这组汇率的基准货币 */
  base: string;
  /** 1 单位基准货币可兑换的目标货币数量 */
  rates: Readonly<Record<string, number>>;
}

export interface ParsedRates {
  table: RateTable;
  missing: string[];
}

export function isPositiveRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function rateFromBase(table: RateTable, code: string): number | null {
  if (code === table.base) return 1;
  const rate = table.rates[code];
  return isPositiveRate(rate) ? rate : null;
}

/**
 * 把 amount 从 from 货币换算成 to 货币。
 * 统一通过汇率表自身的基准货币交叉换算，所以即使用户刚刚调整了列表顺序、
 * 新汇率还没返回，旧汇率表算出来的结果依然正确。
 * 汇率不可用时返回 null。
 */
export function convert(
  amount: number,
  from: string,
  to: string,
  table: RateTable | null,
): number | null {
  if (from === to) return amount;
  if (!table) return null;

  const fromRate = rateFromBase(table, from);
  const toRate = rateFromBase(table, to);
  if (fromRate === null || toRate === null) return null;

  return (amount / fromRate) * toRate;
}

/** 1 单位 from 货币可兑换多少 to 货币 */
export function getRate(table: RateTable | null, from: string, to: string): number | null {
  return convert(1, from, to, table);
}

/** 解析用户输入的金额，空值、非数字、负数返回 null */
export function parseAmount(input: string): number | null {
  if (input.trim() === '') return null;
  const value = Number(input);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function formatAmount(value: number): string {
  return value.toFixed(2);
}

export function formatRate(rate: number): string {
  return rate.toFixed(4);
}

/** 校验 /api/rates 的响应，格式不对时返回 null */
export function parseRatesResponse(data: unknown): ParsedRates | null {
  if (typeof data !== 'object' || data === null) return null;

  const { base, rates, missing } = data as Record<string, unknown>;
  if (!isCurrencyCode(base) || typeof rates !== 'object' || rates === null) return null;

  const validRates = Object.fromEntries(
    Object.entries(rates).filter(
      (entry): entry is [string, number] => isCurrencyCode(entry[0]) && isPositiveRate(entry[1]),
    ),
  );
  const validMissing = Array.isArray(missing) ? missing.filter(isCurrencyCode) : [];

  return { table: { base, rates: validRates }, missing: validMissing };
}
