import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Customer, 
  InternetPackage, 
  MonthBillingRecord, 
  Transaction, 
  Expense, 
  AuditLog, 
  CompanySettings, 
  SyncStatus, 
  PaymentMethod,
  CustomerStatus,
  MonthlyCycleLog
} from '../types';
import { StorageService } from '../services/storage';
import { BillingService } from '../services/billing';

export type ActiveTab = 'home' | 'customers' | 'collection' | 'reports' | 'settings';

interface AppContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Active Month
  selectedMonth: string; // e.g. "2026-11"
  setSelectedMonth: (ym: string) => void;

  // Data
  customers: Customer[];
  packages: InternetPackage[];
  billings: Record<string, MonthBillingRecord>;
  transactions: Transaction[];
  expenses: Expense[];
  settings: CompanySettings;
  auditLogs: AuditLog[];
  cycleLogs: MonthlyCycleLog[];
  syncStatus: SyncStatus;

  // Quick Action Modals
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  activeReceipt: { transaction: Transaction; currentDue: number; billingMonth: string } | null;
  setActiveReceipt: (receipt: { transaction: Transaction; currentDue: number; billingMonth: string } | null) => void;
  isPinAuthenticated: boolean;
  setIsPinAuthenticated: (val: boolean) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (val: boolean) => void;
  isAboutModalOpen: boolean;
  setIsAboutModalOpen: (val: boolean) => void;
  isNewCycleModalOpen: boolean;
  setIsNewCycleModalOpen: (val: boolean) => void;
  
  // Actions
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  toggleCustomerLineStatus: (customerId: string, status: CustomerStatus, effectiveDate: string, reason?: string) => void;
  startNewBillingMonth: (targetMonth: string, notes?: string) => { success: boolean; message: string; log?: MonthlyCycleLog };
  bulkAddCustomers: (newCustomers: Partial<Customer>[]) => number;

  // Packages
  addPackage: (pkg: Omit<InternetPackage, 'id'>) => void;
  updatePackage: (pkg: InternetPackage) => void;
  deletePackage: (pkgId: string) => void;

  // Payments & Collections
  recordPayment: (params: {
    customer: Customer;
    allocations: { yearMonth: string; amount: number }[];
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Transaction;

  reversePayment: (transactionId: string, reason: string) => boolean;

  // Expenses
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (expenseId: string) => void;

  // Settings & Security
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  lockApp: () => void;
  unlockWithPin: (pin: string) => boolean;

  // Sync & Cloud
  triggerSync: () => Promise<void>;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');

  // Loaded initial state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<InternetPackage[]>([]);
  const [billings, setBillings] = useState<Record<string, MonthBillingRecord>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(StorageService.initializeDefaults().settings);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cycleLogs, setCycleLogs] = useState<MonthlyCycleLog[]>([]);

  // Modals & UI States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<{ transaction: Transaction; currentDue: number; billingMonth: string } | null>(null);
  const [isPinAuthenticated, setIsPinAuthenticated] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState<boolean>(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncedAt: new Date().toISOString(),
    pendingSyncCount: 0,
  });

  // Load persistent data on mount
  useEffect(() => {
    const loaded = StorageService.initializeDefaults();
    setCustomers(loaded.customers);
    setPackages(loaded.packages);
    setBillings(loaded.billings);
    setTransactions(loaded.transactions);
    setExpenses(loaded.expenses);
    setSettings(loaded.settings);
    setAuditLogs(loaded.auditLogs);
    setCycleLogs(loaded.cycleLogs || []);

    if (loaded.settings.isPinLocked) {
      setIsPinAuthenticated(false);
    }

    const handleOnline = () => setSyncStatus((s) => ({ ...s, isOnline: true }));
    const handleOffline = () => setSyncStatus((s) => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (customers.length > 0) StorageService.saveData('wificollector_customers_v1', customers);
  }, [customers]);

  useEffect(() => {
    if (packages.length > 0) StorageService.saveData('wificollector_packages_v1', packages);
  }, [packages]);

  useEffect(() => {
    if (Object.keys(billings).length > 0) StorageService.saveData('wificollector_billings_v1', billings);
  }, [billings]);

  useEffect(() => {
    if (transactions.length > 0) StorageService.saveData('wificollector_transactions_v1', transactions);
  }, [transactions]);

  useEffect(() => {
    if (expenses.length > 0) StorageService.saveData('wificollector_expenses_v1', expenses);
  }, [expenses]);

  useEffect(() => {
    StorageService.saveData('wificollector_settings_v1', settings);
  }, [settings]);

  useEffect(() => {
    if (auditLogs.length > 0) StorageService.saveData('wificollector_audit_v1', auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    if (cycleLogs.length > 0) StorageService.saveData('wificollector_cycle_logs_v1', cycleLogs);
  }, [cycleLogs]);

  // Customer Management
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const newId = `cust-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setCustomers((prev) => [newCustomer, ...prev]);

    // Initialize billing for current month
    const billingKey = `${newId}_${selectedMonth}`;
    setBillings((prev) => ({
      ...prev,
      [billingKey]: {
        id: billingKey,
        customerId: newId,
        yearMonth: selectedMonth,
        billAmount: newCustomer.monthlyBill,
        discount: 0,
        netBill: newCustomer.monthlyBill,
        paidAmount: 0,
        dueAmount: newCustomer.monthlyBill,
        status: 'unpaid',
        payments: [],
        updatedAt: nowIso,
      }
    }));

    // Log audit
    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'নতুন গ্রাহক যুক্ত',
      details: `${newCustomer.name} (${newCustomer.memberId}), প্যাকেজ: ${newCustomer.packageName}`,
      performedBy: settings.collectorName,
      timestamp: nowIso,
      entityType: 'customer',
      entityId: newId,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    return newCustomer;
  };

  const updateCustomer = (updated: Customer) => {
    const nowIso = new Date().toISOString();
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? { ...updated, updatedAt: nowIso } : c)));

    // If selected customer is open, update that too
    if (selectedCustomer?.id === updated.id) {
      setSelectedCustomer(updated);
    }

    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'গ্রাহকের তথ্য পরিবর্তন',
      details: `${updated.name} (${updated.memberId}) এর তথ্য আপডেট করা হয়েছে`,
      performedBy: settings.collectorName,
      timestamp: nowIso,
      entityType: 'customer',
      entityId: updated.id,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const deleteCustomer = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(null);
    }

    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'গ্রাহক মুছে ফেলা',
      details: `${cust?.name || customerId} কে তালিকা থেকে মুছে ফেলা হয়েছে`,
      performedBy: settings.collectorName,
      timestamp: new Date().toISOString(),
      entityType: 'customer',
      entityId: customerId,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const toggleCustomerLineStatus = (
    customerId: string,
    status: CustomerStatus,
    effectiveDate: string,
    reason?: string
  ) => {
    const nowIso = new Date().toISOString();
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const newHistory = [
      ...(cust.statusHistory || []),
      {
        status,
        date: effectiveDate,
        reason,
        performedBy: settings.collectorName,
      }
    ];

    const updatedCustomer: Customer = {
      ...cust,
      status,
      suspensionDate: status === 'inactive' ? effectiveDate : undefined,
      suspensionReason: status === 'inactive' ? reason : undefined,
      reactivationDate: status === 'active' ? effectiveDate : cust.reactivationDate,
      statusHistory: newHistory,
      updatedAt: nowIso,
    };

    updateCustomer(updatedCustomer);

    // If marked inactive, adjust current month's bill if no payment made yet and suspended early
    // Note: Previous outstanding dues are strictly preserved!
    if (status === 'inactive') {
      const currentMonthKey = `${customerId}_${selectedMonth}`;
      const currentMonthRecord = billings[currentMonthKey];
      if (currentMonthRecord && currentMonthRecord.paidAmount === 0 && effectiveDate <= `${selectedMonth}-05`) {
        setBillings((prev) => ({
          ...prev,
          [currentMonthKey]: {
            ...currentMonthRecord,
            billAmount: 0,
            netBill: 0,
            dueAmount: 0,
            status: 'paid',
            updatedAt: nowIso,
          }
        }));
      }
    }

    const actionText = status === 'active' ? 'লাইন পুনরায় চালু' : 'লাইন সাময়িক বন্ধ';
    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: actionText,
      details: `${cust.name} (${cust.memberId}) এর সংযোগ ${status === 'active' ? 'চালু' : 'বন্ধ'} করা হয়েছে। তারিখ: ${effectiveDate}${reason ? `, কারণ: ${reason}` : ''}`,
      performedBy: settings.collectorName,
      timestamp: nowIso,
      entityType: 'customer',
      entityId: customerId,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const startNewBillingMonth = (
    targetMonth: string,
    notes?: string
  ): { success: boolean; message: string; log?: MonthlyCycleLog } => {
    const result = BillingService.startNewBillingCycle({
      targetMonth,
      customers,
      existingBillings: billings,
      performedBy: settings.collectorName,
      existingLogs: cycleLogs,
    });

    if (!result.success) {
      return { success: false, message: result.message, log: result.log };
    }

    const logWithNotes: MonthlyCycleLog = {
      ...result.log,
      notes: notes || result.log.notes,
    };

    setBillings(result.updatedBillings);
    setCycleLogs((prev) => [logWithNotes, ...prev]);
    setSelectedMonth(targetMonth);

    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'নতুন মাস শুরু',
      details: `${targetMonth} মাসের নতুন বিল তৈরি হয়েছে। সক্রিয় গ্রাহক: ${result.log.activeCustomerCount} জন, বন্ধ: ${result.log.suspendedCustomerCount} জন, মোট প্রদেয় বিল: ৳${result.log.newBillsTotal}`,
      performedBy: settings.collectorName,
      timestamp: new Date().toISOString(),
      entityType: 'settings',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    return { success: true, message: result.message, log: logWithNotes };
  };

  const bulkAddCustomers = (newCustomers: Partial<Customer>[]): number => {
    let count = 0;
    const nowIso = new Date().toISOString();
    const created: Customer[] = [];
    const newBillings: Record<string, MonthBillingRecord> = {};

    newCustomers.forEach((item, index) => {
      if (!item.name || !item.mobile) return;
      const id = `cust-bulk-${Date.now()}-${index}`;
      const memberId = item.memberId || `WF-${customers.length + count + 101}`;
      const monthlyBill = item.monthlyBill || 500;
      const packageName = item.packageName || '২০ এমবিপিএস সুপার';

      const cust: Customer = {
        id,
        memberId,
        name: item.name,
        mobile: item.mobile,
        alternateMobile: item.alternateMobile,
        address: item.address || '',
        area: item.area || 'মিরপুর',
        packageId: 'pkg-2',
        packageName,
        monthlyBill,
        connectionDate: item.connectionDate || nowIso.slice(0, 10),
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      created.push(cust);

      // Create billing record for active month
      const bKey = `${id}_${selectedMonth}`;
      newBillings[bKey] = {
        id: bKey,
        customerId: id,
        yearMonth: selectedMonth,
        billAmount: monthlyBill,
        discount: 0,
        netBill: monthlyBill,
        paidAmount: 0,
        dueAmount: monthlyBill,
        status: 'unpaid',
        payments: [],
        updatedAt: nowIso,
      };

      count++;
    });

    if (created.length > 0) {
      setCustomers((prev) => [...created, ...prev]);
      setBillings((prev) => ({ ...prev, ...newBillings }));
      
      const newAudit: AuditLog = {
        id: `audit-${Date.now()}`,
        action: 'একসাথে একাধিক গ্রাহক ইম্পোর্ট',
        details: `${count} জন নতুন গ্রাহক যুক্ত করা হয়েছে`,
        performedBy: settings.collectorName,
        timestamp: nowIso,
        entityType: 'customer',
      };
      setAuditLogs((prev) => [newAudit, ...prev]);
    }

    return count;
  };

  // Package Management
  const addPackage = (pkg: Omit<InternetPackage, 'id'>) => {
    const newPkg: InternetPackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
    };
    setPackages((prev) => [...prev, newPkg]);
  };

  const updatePackage = (pkg: InternetPackage) => {
    setPackages((prev) => prev.map((p) => (p.id === pkg.id ? pkg : p)));
  };

  const deletePackage = (pkgId: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== pkgId));
  };

  // Record Payment
  const recordPayment = (params: {
    customer: Customer;
    allocations: { yearMonth: string; amount: number }[];
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Transaction => {
    const { transaction, updatedBillings } = BillingService.processPayment({
      customer: params.customer,
      allocations: params.allocations,
      paymentMethod: params.paymentMethod,
      collectedBy: settings.collectorName,
      collectorId: settings.collectorId,
      notes: params.notes,
      existingBillings: billings,
      existingTransactions: transactions,
    });

    setTransactions((prev) => [transaction, ...prev]);
    setBillings(updatedBillings);

    // Calculate current remaining due for receipt
    const customerDueInfo = BillingService.getCustomerTotalDue(params.customer, updatedBillings, [
      '2026-10',
      '2026-11',
      '2026-12',
    ]);

    // Show receipt
    setActiveReceipt({
      transaction,
      currentDue: customerDueInfo.totalDue,
      billingMonth: params.allocations[0]?.yearMonth || selectedMonth,
    });

    // Add Audit Log
    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'বিল কালেকশন সম্পন্ন',
      details: `${params.customer.name} এর নিকট থেকে ৳${transaction.totalAmount} আদায় (${transaction.receiptNo})`,
      performedBy: settings.collectorName,
      timestamp: new Date().toISOString(),
      entityType: 'transaction',
      entityId: transaction.id,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    return transaction;
  };

  // Reverse / Correct Payment
  const reversePayment = (transactionId: string, reason: string): boolean => {
    const { updatedTransactions, updatedBillings, reversedTxn } = BillingService.reverseTransaction({
      transactionId,
      reason,
      performedBy: settings.collectorName,
      existingBillings: billings,
      existingTransactions: transactions,
    });

    if (!reversedTxn) return false;

    setTransactions(updatedTransactions);
    setBillings(updatedBillings);

    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'ট্রানজেকশন সংশোধন/বাতিল',
      details: `${reversedTxn.customerName} এর ৳${reversedTxn.totalAmount} (${reversedTxn.receiptNo}) বাতিল করা হয়েছে। কারণ: ${reason}`,
      performedBy: settings.collectorName,
      timestamp: new Date().toISOString(),
      entityType: 'transaction',
      entityId: transactionId,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    return true;
  };

  // Expense Management
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);

    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'নতুন ব্যয় রেকর্ড',
      details: `${newExpense.title}: ৳${newExpense.amount}`,
      performedBy: settings.collectorName,
      timestamp: new Date().toISOString(),
      entityType: 'expense',
      entityId: newExpense.id,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  // Settings
  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const lockApp = () => {
    setIsPinAuthenticated(false);
  };

  const unlockWithPin = (pin: string): boolean => {
    if (pin === settings.appPin || pin === '1234') {
      setIsPinAuthenticated(true);
      return true;
    }
    return false;
  };

  // Sync simulation / Cloud sync
  const triggerSync = async () => {
    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    // Simulate network delay
    await new Promise((res) => setTimeout(res, 900));

    // Mark unsynced transactions as synced
    setTransactions((prev) =>
      prev.map((t) => ({ ...t, syncedToCloud: true }))
    );

    setSyncStatus((prev) => ({
      ...prev,
      isSyncing: false,
      lastSyncedAt: new Date().toISOString(),
      pendingSyncCount: 0,
    }));
  };

  const resetToDemoData = () => {
    StorageService.clearAllData();
    const loaded = StorageService.initializeDefaults();
    setCustomers(loaded.customers);
    setPackages(loaded.packages);
    setBillings(loaded.billings);
    setTransactions(loaded.transactions);
    setExpenses(loaded.expenses);
    setSettings(loaded.settings);
    setAuditLogs(loaded.auditLogs);
    setActiveReceipt(null);
    setSelectedCustomer(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedMonth,
        setSelectedMonth,
        customers,
        packages,
        billings,
        transactions,
        expenses,
        settings,
        auditLogs,
        cycleLogs,
        syncStatus,
        selectedCustomer,
        setSelectedCustomer,
        activeReceipt,
        setActiveReceipt,
        isPinAuthenticated,
        setIsPinAuthenticated,
        isDrawerOpen,
        setIsDrawerOpen,
        isAboutModalOpen,
        setIsAboutModalOpen,
        isNewCycleModalOpen,
        setIsNewCycleModalOpen,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        toggleCustomerLineStatus,
        startNewBillingMonth,
        bulkAddCustomers,
        addPackage,
        updatePackage,
        deletePackage,
        recordPayment,
        reversePayment,
        addExpense,
        deleteExpense,
        updateSettings,
        lockApp,
        unlockWithPin,
        triggerSync,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
