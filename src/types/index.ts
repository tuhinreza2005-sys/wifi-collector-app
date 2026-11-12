export type PaymentMethod = 
  | 'cash'        // নগদ টাকা
  | 'bkash'       // বিকাশ
  | 'nagad'       // নগদ
  | 'rocket'      // রকেট
  | 'bank'        // ব্যাংক ট্রান্সফার
  | 'other';      // অন্যান্য

export type CustomerStatus = 'active' | 'inactive';

export type BillStatus = 'paid' | 'partial' | 'unpaid';

export interface InternetPackage {
  id: string;
  name: string;        // e.g. "20 Mbps Super"
  speed: string;       // e.g. "20 Mbps"
  monthlyFee: number;  // e.g. 500
  description?: string;
}

export interface Customer {
  id: string;
  memberId: string;       // Unique ID like "WIFI-101"
  name: string;
  mobile: string;
  alternateMobile?: string;
  address: string;
  area: string;           // e.g. "মিরপুর-১০", "উত্তরা সেক্টর-৪"
  packageId: string;
  packageName: string;
  monthlyBill: number;
  connectionDate: string; // ISO date YYYY-MM-DD
  status: CustomerStatus;
  suspensionDate?: string; // তারিখ যখন লাইন বন্ধ করা হয়েছে
  suspensionReason?: string; // লাইন বন্ধের কারণ
  reactivationDate?: string; // পুনরায় চালুর তারিখ
  statusHistory?: {
    status: CustomerStatus;
    date: string;
    reason?: string;
    performedBy: string;
  }[];
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyCycleLog {
  id: string;
  targetMonth: string;          // e.g. "2026-12"
  generatedAt: string;          // ISO
  generatedBy: string;
  activeCustomerCount: number;
  suspendedCustomerCount: number;
  previousOutstanding: number;
  newBillsTotal: number;
  totalReceivable: number;
  notes?: string;
}

export interface MonthBillingRecord {
  id: string;                 // unique, e.g. "cust123_2026-11"
  customerId: string;
  yearMonth: string;          // format "YYYY-MM" e.g. "2026-11"
  billAmount: number;         // bill for this month
  discount: number;           // any discount applied
  netBill: number;            // billAmount - discount
  paidAmount: number;         // total paid so far for this month
  dueAmount: number;          // netBill - paidAmount
  status: BillStatus;         // 'paid' (সব পরিশোধ), 'partial' (আংশিক), 'unpaid' (বকেয়া)
  payments: PaymentItem[];    // breakdown of payments made for this month's bill
  lastPaymentDate?: string;
  updatedAt: string;
}

export interface PaymentItem {
  transactionId: string;
  receiptNo: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;               // ISO date-time string
  collectedBy: string;
  notes?: string;
}

export interface Transaction {
  id: string;                 // Unique TXN ID (e.g. "TXN-20261111-8492")
  receiptNo: string;          // Formatted receipt no (e.g. "RCP-10492")
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerMemberId: string;
  customerArea: string;
  targetMonths: string[];     // ["2026-11"] or multiple
  monthAllocations: {         // Breakdown if paid for multiple months
    yearMonth: string;
    amount: number;
  }[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  collectedBy: string;
  collectorId?: string;
  timestamp: string;          // ISO string
  notes?: string;
  syncedToCloud: boolean;
  isReversed?: boolean;       // If transaction was corrected/cancelled
  reversalReason?: string;
  reversalDate?: string;
  reversalBy?: string;
}

export type ExpenseCategory = 
  | 'bandwidth'     // ইন্টারনেট ব্যান্ডউইথ খরচ
  | 'rent'          // অফিস ভাড়া
  | 'salary'        // কর্মচারী বেতন
  | 'equipment'     // সরঞ্জাম ও ক্যাবল ক্রয়
  | 'maintenance'   // লাইন রক্ষণাবেক্ষণ
  | 'electricity'   // বিদ্যুৎ বিল
  | 'other';        // অন্যান্য খরচ

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;               // YYYY-MM-DD
  month: string;              // YYYY-MM
  recordedBy: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  timestamp: string;
  entityType: 'customer' | 'transaction' | 'expense' | 'package' | 'settings';
  entityId?: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  currencySymbol: string;     // '৳'
  collectorName: string;
  collectorId: string;
  appPin: string;             // 4-digit PIN, default '1234'
  isPinLocked: boolean;
  autoSync: boolean;
  firebaseConfig?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt?: string;
  pendingSyncCount: number;
  error?: string;
}
