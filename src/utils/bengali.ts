import { PaymentMethod, ExpenseCategory } from '../types';

const EN_TO_BN_DIGITS: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

export const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

/**
 * Converts English number or string to Bengali digits
 */
export function toBnNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '০';
  const str = typeof num === 'number' ? num.toLocaleString('en-US') : String(num);
  return str.replace(/[0-9]/g, (digit) => EN_TO_BN_DIGITS[digit] || digit);
}

/**
 * Converts Bengali digits string to standard English digits
 */
export function toEnNumber(str: string): string {
  if (!str) return '';
  return str.replace(/[০-৯]/g, (digit) => BN_TO_EN_DIGITS[digit] || digit);
}

/**
 * Format Currency in Bengali (e.g. ৳১,৫০০)
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const formattedEn = rounded.toLocaleString('en-IN');
  return `৳${formattedEn.replace(/[0-9]/g, (d) => EN_TO_BN_DIGITS[d] || d)}`;
}

/**
 * Converts "YYYY-MM" to Bengali month name + year (e.g. "2026-11" -> "নভেম্বর ২০২৬")
 */
export function formatYearMonth(yearMonthStr: string): string {
  if (!yearMonthStr) return '';
  const parts = yearMonthStr.split('-');
  if (parts.length < 2) return yearMonthStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = BN_MONTHS[monthIdx] || parts[1];
  return `${monthName} ${toBnNumber(year)}`;
}

/**
 * Format ISO date string to Bengali friendly date "১১ নভেম্বর, ২০২৬"
 */
export function formatBnDate(isoString: string, includeTime = false): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = d.getDate();
    const month = BN_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    const dateStr = `${toBnNumber(day)} ${month}, ${toBnNumber(year)}`;
    
    if (includeTime) {
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'বিকাল' : 'সকাল';
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;
      return `${dateStr} (${period} ${toBnNumber(hours)}:${toBnNumber(minutes)})`;
    }
    
    return dateStr;
  } catch {
    return isoString;
  }
}

/**
 * Get Bengali label for PaymentMethod
 */
export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'cash':
      return 'নগদ টাকা';
    case 'bkash':
      return 'বিকাশ (bKash)';
    case 'nagad':
      return 'নগদ (Nagad)';
    case 'rocket':
      return 'রকেট (Rocket)';
    case 'bank':
      return 'ব্যাংক ট্রান্সফার';
    case 'other':
      return 'অন্যান্য';
    default:
      return method;
  }
}

/**
 * Get Bengali label for Expense Category
 */
export function getExpenseCategoryLabel(cat: ExpenseCategory): string {
  switch (cat) {
    case 'bandwidth':
      return 'ব্যান্ডউইথ খরচ';
    case 'rent':
      return 'অফিস ভাড়া';
    case 'salary':
      return 'কর্মচারী বেতন';
    case 'equipment':
      return 'সরঞ্জাম ও ক্যাবল';
    case 'maintenance':
      return 'রক্ষণাবেক্ষণ';
    case 'electricity':
      return 'বিদ্যুৎ বিল';
    case 'other':
      return 'অন্যান্য';
    default:
      return cat;
  }
}

/**
 * Normalizes user search input to match both English and Bengali queries
 */
export function normalizeSearch(query: string): string {
  return toEnNumber(query.trim().toLowerCase());
}
