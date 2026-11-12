import { 
  Customer, 
  InternetPackage, 
  MonthBillingRecord, 
  Transaction, 
  Expense, 
  AuditLog, 
  CompanySettings,
  MonthlyCycleLog
} from '../types';

const DB_KEYS = {
  CUSTOMERS: 'wificollector_customers_v1',
  PACKAGES: 'wificollector_packages_v1',
  BILLINGS: 'wificollector_billings_v1',
  TRANSACTIONS: 'wificollector_transactions_v1',
  EXPENSES: 'wificollector_expenses_v1',
  AUDIT_LOGS: 'wificollector_audit_v1',
  SETTINGS: 'wificollector_settings_v1',
  SYNC_QUEUE: 'wificollector_sync_queue_v1',
  CYCLE_LOGS: 'wificollector_cycle_logs_v1',
};

export const DEFAULT_PACKAGES: InternetPackage[] = [
  { id: 'pkg-1', name: '১০ এমবিপিএস সাধারণ', speed: '10 Mbps', monthlyFee: 400, description: 'ইউটিউব ও ব্রাউজিং' },
  { id: 'pkg-2', name: '২০ এমবিপিএস সুপার', speed: '20 Mbps', monthlyFee: 500, description: 'এইচডি ভিডিও ও পরিবার' },
  { id: 'pkg-3', name: '৩০ এমবিপিএস আল্ট্রা', speed: '30 Mbps', monthlyFee: 600, description: 'গেমিং ও দ্রুত ডাউনলোড' },
  { id: 'pkg-4', name: '৪০ এমবিপিএস টার্বো', speed: '40 Mbps', monthlyFee: 800, description: 'বাণিজ্যিক ও ফ্রিল্যান্সার' },
  { id: 'pkg-5', name: '৫০ এমবিপিএস প্রিমিয়াম', speed: '50 Mbps', monthlyFee: 1000, description: 'আনলিমিটেড হাই-স্পিড' },
];

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'স্পিডনেট অনলাইন ব্রডব্যান্ড',
  tagline: 'দ্রুত ও নিরবচ্ছিন্ন ইন্টারনেট সংযোগ',
  phone: '01711-002233',
  email: 'speednet.isp@gmail.com',
  address: 'বাড়ি # ১২, রোড # ৪, মিরপুর-১০, ঢাকা-১২১৬',
  currencySymbol: '৳',
  collectorName: 'আরিফ হোসেন',
  collectorId: 'COL-01',
  appPin: '1234',
  isPinLocked: false,
  autoSync: true,
};

// Seed Realistic Customers
export function generateSeedCustomers(): Customer[] {
  const areas = ['মিরপুর-১০', 'মিরপুর-১', 'উত্তরা সেক্টর-৩', 'উত্তরা সেক্টর-১১', 'বাড্ডা', 'বনশ্রী', 'মোহাম্মদপুর', 'যাত্রাবাড়ী', 'ধানমন্ডি'];
  const firstNames = ['মোঃ রফিকুল', 'আব্দুল', 'তানভীর', 'মাহমুদুল', 'শাকিল', 'কামরুল', 'রেজাউল', 'সাইফুল', 'আনোয়ার', 'নাসির', 'জাহিদুল', 'শামীম', 'ফারুক', 'বোরহান', 'তারেক', 'আসিফ', 'মাসুদ', 'নজরুল', 'সোহেল', 'রাশেদ'];
  const lastNames = ['ইসলাম', 'হাসান', 'আহমেদ', 'হোসেন', 'উদ্দিন', 'চৌধুরী', 'খান', 'আলম', 'করিম', 'রহমান', 'শেখ', 'মিয়া'];
  const packages = DEFAULT_PACKAGES;

  const customers: Customer[] = [];
  let idCounter = 101;

  for (let i = 0; i < 45; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3 + 2) % lastNames.length];
    const name = `${fn} ${ln}`;
    const area = areas[i % areas.length];
    const pkg = packages[i % packages.length];
    const mobileDigits = (171000000 + i * 179 + 3421).toString().slice(0, 8);
    const mobile = `017${mobileDigits}`;
    const memberId = `WF-${idCounter}`;
    const connMonth = ((i % 12) + 1).toString().padStart(2, '0');

    customers.push({
      id: `cust-${idCounter}`,
      memberId,
      name,
      mobile,
      alternateMobile: i % 3 === 0 ? `018${mobileDigits}` : undefined,
      address: `বাড়ি #${(i % 50) + 1}, রোড #${(i % 12) + 1}, ব্লক-${String.fromCharCode(65 + (i % 6))}`,
      area,
      packageId: pkg.id,
      packageName: pkg.name,
      monthlyBill: pkg.monthlyFee,
      connectionDate: `2025-${connMonth}-15`,
      status: i === 42 ? 'inactive' : 'active',
      latitude: 23.75 + (i % 10) * 0.01,
      longitude: 90.38 + (i % 10) * 0.01,
      createdAt: new Date(2025, i % 12, 1).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    idCounter++;
  }

  return customers;
}

// Generate sample billing records & transactions for seed customers
export function generateSeedBillingAndTransactions(customers: Customer[]): {
  billings: Record<string, MonthBillingRecord>;
  transactions: Transaction[];
  expenses: Expense[];
} {
  const billings: Record<string, MonthBillingRecord> = {};
  const transactions: Transaction[] = [];
  const currentMonth = '2026-11';
  const prevMonth = '2026-10';
  let txnCounter = 1001;

  customers.forEach((cust, idx) => {
    // 1. Previous Month (2026-10)
    // Most paid, a few had partial or unpaid
    const prevKey = `${cust.id}_${prevMonth}`;
    const prevPaid = idx % 7 === 0 ? 0 : (idx % 11 === 0 ? cust.monthlyBill / 2 : cust.monthlyBill);
    const prevStatus = prevPaid >= cust.monthlyBill ? 'paid' : (prevPaid > 0 ? 'partial' : 'unpaid');

    const prevPayments = prevPaid > 0 ? [{
      transactionId: `TXN-202610-${txnCounter}`,
      receiptNo: `RCP-${txnCounter}`,
      amount: prevPaid,
      paymentMethod: (idx % 2 === 0 ? 'cash' : 'bkash') as any,
      date: `2026-10-${((idx % 25) + 2).toString().padStart(2, '0')}T11:00:00.000Z`,
      collectedBy: 'আরিফ হোসেন',
    }] : [];

    billings[prevKey] = {
      id: prevKey,
      customerId: cust.id,
      yearMonth: prevMonth,
      billAmount: cust.monthlyBill,
      discount: 0,
      netBill: cust.monthlyBill,
      paidAmount: prevPaid,
      dueAmount: cust.monthlyBill - prevPaid,
      status: prevStatus,
      payments: prevPayments,
      lastPaymentDate: prevPayments[0]?.date,
      updatedAt: new Date().toISOString(),
    };

    if (prevPaid > 0) {
      transactions.push({
        id: `TXN-202610-${txnCounter}`,
        receiptNo: `RCP-${txnCounter}`,
        customerId: cust.id,
        customerName: cust.name,
        customerMobile: cust.mobile,
        customerMemberId: cust.memberId,
        customerArea: cust.area,
        targetMonths: [prevMonth],
        monthAllocations: [{ yearMonth: prevMonth, amount: prevPaid }],
        totalAmount: prevPaid,
        paymentMethod: (idx % 2 === 0 ? 'cash' : 'bkash') as any,
        collectedBy: 'আরিফ হোসেন',
        collectorId: 'COL-01',
        timestamp: `2026-10-${((idx % 25) + 2).toString().padStart(2, '0')}T11:00:00.000Z`,
        syncedToCloud: true,
      });
      txnCounter++;
    }

    // 2. Current Month (2026-11)
    // About 50% paid, 15% partial, 35% unpaid
    const currKey = `${cust.id}_${currentMonth}`;
    let currPaid = 0;
    let currStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';

    if (idx % 3 === 0) {
      // Fully paid
      currPaid = cust.monthlyBill;
      currStatus = 'paid';
    } else if (idx % 5 === 0) {
      // Partial paid
      currPaid = Math.floor(cust.monthlyBill / 2);
      currStatus = 'partial';
    } else {
      // Unpaid
      currPaid = 0;
      currStatus = 'unpaid';
    }

    const currPayments = currPaid > 0 ? [{
      transactionId: `TXN-202611-${txnCounter}`,
      receiptNo: `RCP-${txnCounter}`,
      amount: currPaid,
      paymentMethod: (idx % 3 === 0 ? 'cash' : (idx % 3 === 1 ? 'bkash' : 'nagad')) as any,
      date: `2026-11-${((idx % 10) + 1).toString().padStart(2, '0')}T14:30:00.000Z`,
      collectedBy: 'আরিফ হোসেন',
    }] : [];

    billings[currKey] = {
      id: currKey,
      customerId: cust.id,
      yearMonth: currentMonth,
      billAmount: cust.monthlyBill,
      discount: 0,
      netBill: cust.monthlyBill,
      paidAmount: currPaid,
      dueAmount: cust.monthlyBill - currPaid,
      status: currStatus,
      payments: currPayments,
      lastPaymentDate: currPayments[0]?.date,
      updatedAt: new Date().toISOString(),
    };

    if (currPaid > 0) {
      transactions.push({
        id: `TXN-202611-${txnCounter}`,
        receiptNo: `RCP-${txnCounter}`,
        customerId: cust.id,
        customerName: cust.name,
        customerMobile: cust.mobile,
        customerMemberId: cust.memberId,
        customerArea: cust.area,
        targetMonths: [currentMonth],
        monthAllocations: [{ yearMonth: currentMonth, amount: currPaid }],
        totalAmount: currPaid,
        paymentMethod: (idx % 3 === 0 ? 'cash' : (idx % 3 === 1 ? 'bkash' : 'nagad')) as any,
        collectedBy: 'আরিফ হোসেন',
        collectorId: 'COL-01',
        timestamp: `2026-11-${((idx % 10) + 1).toString().padStart(2, '0')}T14:30:00.000Z`,
        syncedToCloud: true,
      });
      txnCounter++;
    }
  });

  const expenses: Expense[] = [
    {
      id: 'exp-1',
      title: 'বিটিসিএল আপস্ট্রিম ব্যান্ডউইথ বিল',
      amount: 15000,
      category: 'bandwidth',
      date: '2026-11-05',
      month: '2026-11',
      recordedBy: 'আরিফ হোসেন',
      receiptNumber: 'BW-9901',
      createdAt: '2026-11-05T10:00:00.000Z',
    },
    {
      id: 'exp-2',
      title: 'মিরপুর শাখা অফিস ভাড়া (নভেম্বর)',
      amount: 8000,
      category: 'rent',
      date: '2026-11-03',
      month: '2026-11',
      recordedBy: 'আরিফ হোসেন',
      receiptNumber: 'RENT-11',
      createdAt: '2026-11-03T09:00:00.000Z',
    },
    {
      id: 'exp-3',
      title: 'ফাইবার অপটিক প্যাচকর্ড ও স্প্লিটার ক্রয়',
      amount: 2500,
      category: 'equipment',
      date: '2026-11-08',
      month: '2026-11',
      recordedBy: 'আরিফ হোসেন',
      receiptNumber: 'SPL-42',
      createdAt: '2026-11-08T15:20:00.000Z',
    },
    {
      id: 'exp-4',
      title: 'বিদ্যুৎ বিল (মিরপুর অফিস)',
      amount: 1850,
      category: 'electricity',
      date: '2026-11-09',
      month: '2026-11',
      recordedBy: 'আরিফ হোসেন',
      receiptNumber: 'DESCO-8812',
      createdAt: '2026-11-09T11:45:00.000Z',
    }
  ];

  return { billings, transactions, expenses };
}

// Storage helpers
export const StorageService = {
  loadData<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`Error loading key ${key}:`, e);
      return fallback;
    }
  },

  saveData<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving key ${key}:`, e);
    }
  },

  initializeDefaults(): {
    customers: Customer[];
    packages: InternetPackage[];
    billings: Record<string, MonthBillingRecord>;
    transactions: Transaction[];
    expenses: Expense[];
    settings: CompanySettings;
    auditLogs: AuditLog[];
    cycleLogs: MonthlyCycleLog[];
  } {
    let settings = this.loadData<CompanySettings | null>(DB_KEYS.SETTINGS, null);
    let packages = this.loadData<InternetPackage[] | null>(DB_KEYS.PACKAGES, null);
    let customers = this.loadData<Customer[] | null>(DB_KEYS.CUSTOMERS, null);
    let billings = this.loadData<Record<string, MonthBillingRecord> | null>(DB_KEYS.BILLINGS, null);
    let transactions = this.loadData<Transaction[] | null>(DB_KEYS.TRANSACTIONS, null);
    let expenses = this.loadData<Expense[] | null>(DB_KEYS.EXPENSES, null);
    let auditLogs = this.loadData<AuditLog[] | null>(DB_KEYS.AUDIT_LOGS, null);
    let cycleLogs = this.loadData<MonthlyCycleLog[] | null>(DB_KEYS.CYCLE_LOGS, null);

    if (!settings) {
      settings = DEFAULT_SETTINGS;
      this.saveData(DB_KEYS.SETTINGS, settings);
    }

    if (!packages || packages.length === 0) {
      packages = DEFAULT_PACKAGES;
      this.saveData(DB_KEYS.PACKAGES, packages);
    }

    if (!cycleLogs) {
      cycleLogs = [
        {
          id: 'cycle-seed-2026-11',
          targetMonth: '2026-11',
          generatedAt: new Date(2026, 10, 1).toISOString(),
          generatedBy: 'সিস্টেম অ্যাডমিন',
          activeCustomerCount: 44,
          suspendedCustomerCount: 1,
          previousOutstanding: 12500,
          newBillsTotal: 25400,
          totalReceivable: 37900,
          notes: 'নভেম্বর ২০২৬ প্রাথমিক বিলিং চক্র শুরু',
        }
      ];
      this.saveData(DB_KEYS.CYCLE_LOGS, cycleLogs);
    }

    if (!customers || customers.length === 0) {
      customers = generateSeedCustomers();
      this.saveData(DB_KEYS.CUSTOMERS, customers);

      const seeded = generateSeedBillingAndTransactions(customers);
      billings = seeded.billings;
      transactions = seeded.transactions;
      expenses = seeded.expenses;

      this.saveData(DB_KEYS.BILLINGS, billings);
      this.saveData(DB_KEYS.TRANSACTIONS, transactions);
      this.saveData(DB_KEYS.EXPENSES, expenses);

      auditLogs = [
        {
          id: 'audit-init',
          action: 'অ্যাপ্লিকেশন শুরু',
          details: `${customers.length} জন গ্রাহক ও ডিফল্ট প্যাকেজ লোড করা হয়েছে`,
          performedBy: 'সিস্টেম',
          timestamp: new Date().toISOString(),
          entityType: 'settings',
        }
      ];
      this.saveData(DB_KEYS.AUDIT_LOGS, auditLogs);
    }

    return {
      customers: customers || [],
      packages: packages || DEFAULT_PACKAGES,
      billings: billings || {},
      transactions: transactions || [],
      expenses: expenses || [],
      settings: settings || DEFAULT_SETTINGS,
      auditLogs: auditLogs || [],
      cycleLogs: cycleLogs || [],
    };
  },

  exportFullBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      customers: this.loadData(DB_KEYS.CUSTOMERS, []),
      packages: this.loadData(DB_KEYS.PACKAGES, []),
      billings: this.loadData(DB_KEYS.BILLINGS, {}),
      transactions: this.loadData(DB_KEYS.TRANSACTIONS, []),
      expenses: this.loadData(DB_KEYS.EXPENSES, []),
      settings: this.loadData(DB_KEYS.SETTINGS, DEFAULT_SETTINGS),
      auditLogs: this.loadData(DB_KEYS.AUDIT_LOGS, []),
      cycleLogs: this.loadData(DB_KEYS.CYCLE_LOGS, []),
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.customers) this.saveData(DB_KEYS.CUSTOMERS, data.customers);
      if (data.packages) this.saveData(DB_KEYS.PACKAGES, data.packages);
      if (data.billings) this.saveData(DB_KEYS.BILLINGS, data.billings);
      if (data.transactions) this.saveData(DB_KEYS.TRANSACTIONS, data.transactions);
      if (data.expenses) this.saveData(DB_KEYS.EXPENSES, data.expenses);
      if (data.settings) this.saveData(DB_KEYS.SETTINGS, data.settings);
      if (data.auditLogs) this.saveData(DB_KEYS.AUDIT_LOGS, data.auditLogs);
      if (data.cycleLogs) this.saveData(DB_KEYS.CYCLE_LOGS, data.cycleLogs);
      return true;
    } catch (e) {
      console.error('Backup import error:', e);
      return false;
    }
  },

  clearAllData(): void {
    Object.values(DB_KEYS).forEach((k) => localStorage.removeItem(k));
  }
};
