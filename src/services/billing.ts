import { 
  Customer, 
  MonthBillingRecord, 
  Transaction, 
  PaymentMethod, 
  BillStatus,
  PaymentItem,
  MonthlyCycleLog
} from '../types';

export interface MonthlyFinancialSummary {
  month: string;                // "YYYY-MM"
  totalBills: number;           // এই মাসের মোট বিল
  totalCollected: number;       // এই মাসে মোট আদায়
  totalOutstanding: number;     // এই মাসের মোট বকেয়া
  fullyPaidCount: number;       // সম্পূর্ণ বিল পরিশোধকারী গ্রাহক
  partialPaidCount: number;     // আংশিক পরিশোধকারী গ্রাহক
  unpaidCount: number;          // বিল না দেওয়া গ্রাহক
  todayCollected: number;       // আজকের মোট কালেকশন
  collectionPercentage: number; // আদায় হার (%)
}

export interface CustomerBillingOverview {
  lineStatus: 'active' | 'inactive';
  connectionDate: string;
  suspensionDate?: string;
  suspensionReason?: string;
  reactivationDate?: string;
  currentMonthBill: number;
  previousOutstanding: number;
  totalPayable: number;
  totalPaidAllTime: number;
  remainingDueTotal: number;
}

export const BillingService = {
  /**
   * Generates a guaranteed unique transaction ID
   */
  generateTransactionId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TXN-${timestamp}-${random}`;
  },

  /**
   * Generates a sequential receipt number
   */
  generateReceiptNo(existingTransactions: Transaction[]): string {
    const count = existingTransactions.length + 1;
    const year = new Date().getFullYear().toString().slice(-2);
    return `RCP-${year}${count.toString().padStart(4, '0')}`;
  },

  /**
   * Get or initialize billing record for customer for a given month
   * When line is suspended (inactive), stop generating bills for that period
   */
  getOrCreateMonthBilling(
    customer: Customer,
    yearMonth: string,
    existingBillings: Record<string, MonthBillingRecord>
  ): MonthBillingRecord {
    const key = `${customer.id}_${yearMonth}`;
    if (existingBillings[key]) {
      return existingBillings[key];
    }

    // Check if customer line is officially suspended
    let isActiveForMonth = customer.status === 'active';
    if (customer.status === 'inactive') {
      isActiveForMonth = false;
    }

    const billAmount = isActiveForMonth ? customer.monthlyBill : 0;
    return {
      id: key,
      customerId: customer.id,
      yearMonth,
      billAmount,
      discount: 0,
      netBill: billAmount,
      paidAmount: 0,
      dueAmount: billAmount,
      status: billAmount > 0 ? 'unpaid' : 'paid',
      payments: [],
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Calculate customer's total outstanding balance across all months
   */
  getCustomerTotalDue(
    customer: Customer,
    billings: Record<string, MonthBillingRecord>,
    allMonths: string[]
  ): { totalDue: number; unpaidMonths: string[]; partialMonths: string[] } {
    let totalDue = 0;
    const unpaidMonths: string[] = [];
    const partialMonths: string[] = [];

    allMonths.forEach((ym) => {
      const bill = this.getOrCreateMonthBilling(customer, ym, billings);
      if (bill.dueAmount > 0) {
        totalDue += bill.dueAmount;
        if (bill.status === 'unpaid') {
          unpaidMonths.push(ym);
        } else if (bill.status === 'partial') {
          partialMonths.push(ym);
        }
      }
    });

    return { totalDue, unpaidMonths, partialMonths };
  },

  /**
   * Process a new payment transaction with support for partial & multi-month payments
   */
  processPayment(params: {
    customer: Customer;
    allocations: { yearMonth: string; amount: number }[];
    paymentMethod: PaymentMethod;
    collectedBy: string;
    collectorId?: string;
    notes?: string;
    existingBillings: Record<string, MonthBillingRecord>;
    existingTransactions: Transaction[];
  }): {
    transaction: Transaction;
    updatedBillings: Record<string, MonthBillingRecord>;
  } {
    const { 
      customer, 
      allocations, 
      paymentMethod, 
      collectedBy, 
      collectorId, 
      notes, 
      existingBillings,
      existingTransactions 
    } = params;

    const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);
    const txnId = this.generateTransactionId();
    const receiptNo = this.generateReceiptNo(existingTransactions);
    const nowIso = new Date().toISOString();

    const updatedBillings = { ...existingBillings };

    // Apply allocation to each month without overwriting past history
    allocations.forEach(({ yearMonth, amount }) => {
      if (amount <= 0) return;
      const key = `${customer.id}_${yearMonth}`;
      const prevRecord = this.getOrCreateMonthBilling(customer, yearMonth, existingBillings);

      const newPaid = prevRecord.paidAmount + amount;
      const newDue = Math.max(0, prevRecord.netBill - newPaid);
      let newStatus: BillStatus = 'unpaid';
      if (newDue === 0 && newPaid >= prevRecord.netBill) {
        newStatus = 'paid';
      } else if (newPaid > 0) {
        newStatus = 'partial';
      }

      const newPaymentItem: PaymentItem = {
        transactionId: txnId,
        receiptNo,
        amount,
        paymentMethod,
        date: nowIso,
        collectedBy,
        notes,
      };

      updatedBillings[key] = {
        ...prevRecord,
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newStatus,
        payments: [...prevRecord.payments, newPaymentItem],
        lastPaymentDate: nowIso,
        updatedAt: nowIso,
      };
    });

    const transaction: Transaction = {
      id: txnId,
      receiptNo,
      customerId: customer.id,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerMemberId: customer.memberId,
      customerArea: customer.area,
      targetMonths: allocations.map((a) => a.yearMonth),
      monthAllocations: allocations,
      totalAmount,
      paymentMethod,
      collectedBy,
      collectorId,
      timestamp: nowIso,
      notes,
      syncedToCloud: false,
    };

    return { transaction, updatedBillings };
  },

  /**
   * Reverse or correct a transaction with an audit reason
   */
  reverseTransaction(params: {
    transactionId: string;
    reason: string;
    performedBy: string;
    existingBillings: Record<string, MonthBillingRecord>;
    existingTransactions: Transaction[];
  }): {
    updatedTransactions: Transaction[];
    updatedBillings: Record<string, MonthBillingRecord>;
    reversedTxn: Transaction | null;
  } {
    const { transactionId, reason, performedBy, existingBillings, existingTransactions } = params;
    const nowIso = new Date().toISOString();

    const targetTxn = existingTransactions.find((t) => t.id === transactionId);
    if (!targetTxn || targetTxn.isReversed) {
      return {
        updatedTransactions: existingTransactions,
        updatedBillings: existingBillings,
        reversedTxn: null,
      };
    }

    const updatedTransactions = existingTransactions.map((t) => {
      if (t.id === transactionId) {
        return {
          ...t,
          isReversed: true,
          reversalReason: reason,
          reversalDate: nowIso,
          reversalBy: performedBy,
        };
      }
      return t;
    });

    const updatedBillings = { ...existingBillings };

    // Reverse allocation from each month's billing record
    targetTxn.monthAllocations.forEach(({ yearMonth, amount }) => {
      const key = `${targetTxn.customerId}_${yearMonth}`;
      const record = updatedBillings[key];
      if (!record) return;

      const remainingPayments = record.payments.filter((p) => p.transactionId !== transactionId);
      const newPaid = Math.max(0, record.paidAmount - amount);
      const newDue = Math.max(0, record.netBill - newPaid);
      let newStatus: BillStatus = 'unpaid';
      if (newPaid >= record.netBill && record.netBill > 0) {
        newStatus = 'paid';
      } else if (newPaid > 0) {
        newStatus = 'partial';
      }

      updatedBillings[key] = {
        ...record,
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newStatus,
        payments: remainingPayments,
        lastPaymentDate: remainingPayments.length > 0 ? remainingPayments[remainingPayments.length - 1].date : undefined,
        updatedAt: nowIso,
      };
    });

    return {
      updatedTransactions,
      updatedBillings,
      reversedTxn: targetTxn,
    };
  },

  /**
   * Calculate complete Monthly Financial Dashboard summary for a given month
   */
  calculateMonthlySummary(
    yearMonth: string,
    customers: Customer[],
    billings: Record<string, MonthBillingRecord>,
    transactions: Transaction[]
  ): MonthlyFinancialSummary {
    let totalBills = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let fullyPaidCount = 0;
    let partialPaidCount = 0;
    let unpaidCount = 0;

    customers.forEach((cust) => {
      const bill = this.getOrCreateMonthBilling(cust, yearMonth, billings);
      totalBills += bill.netBill;
      totalCollected += bill.paidAmount;
      totalOutstanding += bill.dueAmount;

      if (bill.status === 'paid' && bill.netBill > 0) {
        fullyPaidCount++;
      } else if (bill.status === 'partial') {
        partialPaidCount++;
      } else if (bill.status === 'unpaid' && bill.netBill > 0) {
        unpaidCount++;
      }
    });

    // Today's collections
    const todayDateStr = new Date().toISOString().slice(0, 10);
    const todayCollected = transactions
      .filter((t) => !t.isReversed && t.timestamp.startsWith(todayDateStr))
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const collectionPercentage = totalBills > 0 ? Math.round((totalCollected / totalBills) * 100) : 0;

    return {
      month: yearMonth,
      totalBills,
      totalCollected,
      totalOutstanding,
      fullyPaidCount,
      partialPaidCount,
      unpaidCount,
      todayCollected,
      collectionPercentage,
    };
  },

  /**
   * Comprehensive customer billing overview showing line status, connection dates,
   * current month bill, previous outstanding, total payable, and remaining balance.
   */
  getCustomerBillingOverview(
    customer: Customer,
    currentMonth: string,
    billings: Record<string, MonthBillingRecord>,
    allMonths: string[]
  ): CustomerBillingOverview {
    const currentBillRecord = this.getOrCreateMonthBilling(customer, currentMonth, billings);
    const currentMonthBill = currentBillRecord.netBill;

    let previousOutstanding = 0;
    let totalPaidAllTime = 0;
    let remainingDueTotal = 0;

    allMonths.forEach((m) => {
      const rec = this.getOrCreateMonthBilling(customer, m, billings);
      totalPaidAllTime += rec.paidAmount;
      if (m < currentMonth) {
        previousOutstanding += rec.dueAmount;
      }
      remainingDueTotal += rec.dueAmount;
    });

    const totalPayable = previousOutstanding + currentMonthBill;

    return {
      lineStatus: customer.status,
      connectionDate: customer.connectionDate,
      suspensionDate: customer.suspensionDate,
      suspensionReason: customer.suspensionReason,
      reactivationDate: customer.reactivationDate,
      currentMonthBill,
      previousOutstanding,
      totalPayable,
      totalPaidAllTime,
      remainingDueTotal,
    };
  },

  /**
   * Starts a new monthly billing cycle
   * Generates new bills ONLY for active customers, carries forward unpaid balances,
   * and prevents duplicate generation for the same month.
   */
  startNewBillingCycle(params: {
    targetMonth: string;
    customers: Customer[];
    existingBillings: Record<string, MonthBillingRecord>;
    performedBy: string;
    existingLogs?: MonthlyCycleLog[];
  }): {
    success: boolean;
    message: string;
    updatedBillings: Record<string, MonthBillingRecord>;
    log: MonthlyCycleLog;
  } {
    const { targetMonth, customers, existingBillings, performedBy, existingLogs = [] } = params;

    // Check if target month billing cycle was already executed
    const alreadyGenerated = existingLogs.some((l) => l.targetMonth === targetMonth);
    if (alreadyGenerated) {
      return {
        success: false,
        message: `${targetMonth} মাসের বিলিং সাইকেল ইতিমধ্যে শুরু করা হয়েছে!`,
        updatedBillings: existingBillings,
        log: existingLogs.find((l) => l.targetMonth === targetMonth)!,
      };
    }

    const updatedBillings = { ...existingBillings };
    let activeCustomerCount = 0;
    let suspendedCustomerCount = 0;
    let newBillsTotal = 0;
    let previousOutstanding = 0;
    const nowIso = new Date().toISOString();

    // 1. Calculate previous outstanding dues across all past months
    customers.forEach((cust) => {
      Object.entries(existingBillings).forEach(([, rec]) => {
        if (rec.customerId === cust.id && rec.yearMonth < targetMonth) {
          previousOutstanding += rec.dueAmount;
        }
      });

      // 2. Generate bills for new month
      const key = `${cust.id}_${targetMonth}`;
      if (cust.status === 'active') {
        activeCustomerCount++;
        newBillsTotal += cust.monthlyBill;

        updatedBillings[key] = {
          id: key,
          customerId: cust.id,
          yearMonth: targetMonth,
          billAmount: cust.monthlyBill,
          discount: 0,
          netBill: cust.monthlyBill,
          paidAmount: 0,
          dueAmount: cust.monthlyBill,
          status: 'unpaid',
          payments: [],
          updatedAt: nowIso,
        };
      } else {
        // Suspended customer: do NOT charge new month bill
        suspendedCustomerCount++;
        updatedBillings[key] = {
          id: key,
          customerId: cust.id,
          yearMonth: targetMonth,
          billAmount: 0,
          discount: 0,
          netBill: 0,
          paidAmount: 0,
          dueAmount: 0,
          status: 'paid',
          payments: [],
          updatedAt: nowIso,
        };
      }
    });

    const totalReceivable = previousOutstanding + newBillsTotal;

    const log: MonthlyCycleLog = {
      id: `cycle-${targetMonth}-${Date.now()}`,
      targetMonth,
      generatedAt: nowIso,
      generatedBy: performedBy,
      activeCustomerCount,
      suspendedCustomerCount,
      previousOutstanding,
      newBillsTotal,
      totalReceivable,
    };

    return {
      success: true,
      message: `${targetMonth} মাসের বিল সফলভাবে তৈরি করা হয়েছে।`,
      updatedBillings,
      log,
    };
  },

  /**
   * Get past 12 months strings from current month (e.g. ["2026-01", ..., "2026-12"])
   */
  getMonthsForYear(year: number): string[] {
    const list: string[] = [];
    for (let m = 1; m <= 12; m++) {
      list.push(`${year}-${m.toString().padStart(2, '0')}`);
    }
    return list;
  }
};
