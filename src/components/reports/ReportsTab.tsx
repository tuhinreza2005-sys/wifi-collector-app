import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Calendar, 
  ArrowUpDown,
  Phone,
  CreditCard,
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  Power,
  History,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BillingService } from '../../services/billing';
import { ExportService } from '../../services/exportService';
import { Transaction } from '../../types';
import { 
  formatCurrency, 
  toBnNumber, 
  formatYearMonth, 
  formatBnDate, 
  getPaymentMethodLabel 
} from '../../utils/bengali';

type ReportSubTab = 'overview' | 'dues' | 'datewise' | 'methods' | 'history' | 'yearly';

export const ReportsTab: React.FC = () => {
  const { 
    customers, 
    billings, 
    transactions, 
    expenses, 
    selectedMonth, 
    setSelectedCustomer, 
    setActiveTab, 
    setActiveReceipt,
    reversePayment,
    cycleLogs,
    setIsNewCycleModalOpen
  } = useApp();

  const [subTab, setSubTab] = useState<ReportSubTab>('overview');
  const [dueAreaFilter, setDueAreaFilter] = useState<string>('all');
  const [dueSearchQuery, setDueSearchQuery] = useState<string>('');
  const [minDueFilter, setMinDueFilter] = useState<number>(0);
  const [reversalTarget, setReversalTarget] = useState<Transaction | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');

  // Calculate current month financial summary
  const summary = BillingService.calculateMonthlySummary(
    selectedMonth,
    customers,
    billings,
    transactions
  );

  // Month-wise Income and Expenses
  const currentMonthExpenses = expenses
    .filter((e) => e.month === selectedMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = summary.totalCollected - currentMonthExpenses;

  // Active vs Inactive Line counts
  const activeCustomersCount = useMemo(
    () => customers.filter((c) => c.status === 'active').length,
    [customers]
  );
  const inactiveCustomersCount = useMemo(
    () => customers.filter((c) => c.status === 'inactive').length,
    [customers]
  );

  // Previous month summary for comparison
  const prevMonthStr = '2026-10';
  const prevSummary = BillingService.calculateMonthlySummary(
    prevMonthStr,
    customers,
    billings,
    transactions
  );

  // 1. Outstanding Dues Customers List
  const outstandingList = useMemo(() => {
    const list: {
      customer: typeof customers[0];
      totalDue: number;
      unpaidMonths: string[];
      lastPaymentDate?: string;
    }[] = [];

    const candidateMonths = ['2026-09', '2026-10', '2026-11'];

    customers.forEach((c) => {
      const dueInfo = BillingService.getCustomerTotalDue(c, billings, candidateMonths);
      if (dueInfo.totalDue > 0) {
        // find last payment date
        let lastDate: string | undefined;
        candidateMonths.forEach((m) => {
          const rec = billings[`${c.id}_${m}`];
          if (rec?.lastPaymentDate) lastDate = rec.lastPaymentDate;
        });

        list.push({
          customer: c,
          totalDue: dueInfo.totalDue,
          unpaidMonths: [...dueInfo.unpaidMonths, ...dueInfo.partialMonths],
          lastPaymentDate: lastDate,
        });
      }
    });

    // Sort by highest due first
    return list.sort((a, b) => b.totalDue - a.totalDue);
  }, [customers, billings]);

  // Filtered Outstanding List
  const filteredOutstanding = useMemo(() => {
    return outstandingList.filter((item) => {
      if (dueAreaFilter !== 'all' && item.customer.area !== dueAreaFilter) return false;
      if (item.totalDue < minDueFilter) return false;
      if (!dueSearchQuery.trim()) return true;

      const q = dueSearchQuery.toLowerCase();
      const matchName = item.customer.name.toLowerCase().includes(q);
      const matchMobile = item.customer.mobile.includes(q);
      const matchId = item.customer.memberId.toLowerCase().includes(q);
      return matchName || matchMobile || matchId;
    });
  }, [outstandingList, dueAreaFilter, minDueFilter, dueSearchQuery]);

  // 2. Date-wise Collection Breakdown
  const dateWiseCollections = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();

    transactions
      .filter((t) => !t.isReversed && t.targetMonths.includes(selectedMonth))
      .forEach((t) => {
        const dateKey = t.timestamp.slice(0, 10);
        const existing = map.get(dateKey) || { total: 0, count: 0 };
        map.set(dateKey, {
          total: existing.total + t.totalAmount,
          count: existing.count + 1,
        });
      });

    return Array.from(map.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth]);

  // 3. Payment Method Breakdown
  const methodWiseCollections = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();

    transactions
      .filter((t) => !t.isReversed && t.targetMonths.includes(selectedMonth))
      .forEach((t) => {
        const existing = map.get(t.paymentMethod) || { total: 0, count: 0 };
        map.set(t.paymentMethod, {
          total: existing.total + t.totalAmount,
          count: existing.count + 1,
        });
      });

    return Array.from(map.entries()).map(([method, data]) => ({
      method,
      label: getPaymentMethodLabel(method as any),
      ...data,
      percent: summary.totalCollected > 0 ? Math.round((data.total / summary.totalCollected) * 100) : 0,
    }));
  }, [transactions, selectedMonth, summary.totalCollected]);

  // 4. Yearly Summary (all months)
  const yearlySummary = useMemo(() => {
    const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
    return months.map((m) => {
      const s = BillingService.calculateMonthlySummary(m, customers, billings, transactions);
      return s;
    });
  }, [customers, billings, transactions]);

  const handleExportMonthly = () => {
    ExportService.exportMonthlyReportToExcel(selectedMonth, customers, billings);
  };

  const handleExportHistory = () => {
    ExportService.exportTransactionsToExcel(transactions);
  };

  const handleConfirmReversal = () => {
    if (!reversalTarget || !reversalReason.trim()) return;
    reversePayment(reversalTarget.id, reversalReason.trim());
    setReversalTarget(null);
    setReversalReason('');
    alert('ট্রানজেকশন সফলভাবে বাতিল করা হয়েছে এবং হিসাব সমন্বয় করা হয়েছে।');
  };

  return (
    <div className="space-y-3 pb-24 pt-1">
      
      {/* Sub Tab Navigation */}
      <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-1 overflow-x-auto text-xs no-scrollbar">
        <button
          onClick={() => setSubTab('overview')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
            subTab === 'overview'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          মাসিক সারসংক্ষেপ
        </button>

        <button
          onClick={() => setSubTab('dues')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
            subTab === 'dues'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          বকেয়া তালিকা ({toBnNumber(outstandingList.length)})
        </button>

        <button
          onClick={() => setSubTab('datewise')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
            subTab === 'datewise'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          তারিখ ভিত্তিক
        </button>

        <button
          onClick={() => setSubTab('methods')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
            subTab === 'methods'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          পেমেন্ট মাধ্যম
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
            subTab === 'history'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          লেনদেন ইতিহাস
        </button>

        <button
          onClick={() => setSubTab('yearly')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
            subTab === 'yearly'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          বাৎসরিক রিপোর্ট
        </button>
      </div>

      {/* SUB-TAB 1: MONTHLY OVERVIEW */}
      {subTab === 'overview' && (
        <div className="space-y-3">
          {/* Main Financial Report Card */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-sm text-gray-900">
                  {formatYearMonth(selectedMonth)} আর্থিক রিপোর্ট
                </h3>
                <p className="text-[11px] text-gray-500">
                  মোট গ্রাহক সংখ্যা: {toBnNumber(customers.length)} জন
                </p>
              </div>
              <button
                onClick={handleExportMonthly}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center space-x-1 hover:bg-emerald-100 border border-emerald-200 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>এক্সেল ডাউনলোড</span>
              </button>
            </div>

            {/* Financial Numbers Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center">
                <span className="text-[10px] text-gray-500 block">মোট বিল</span>
                <span className="text-sm font-bold text-gray-900 block mt-0.5">
                  {formatCurrency(summary.totalBills)}
                </span>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-800 block">মোট আদায়</span>
                <span className="text-sm font-bold text-emerald-700 block mt-0.5">
                  {formatCurrency(summary.totalCollected)}
                </span>
              </div>

              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-center">
                <span className="text-[10px] text-rose-800 block">মোট বকেয়া</span>
                <span className="text-sm font-bold text-rose-700 block mt-0.5">
                  {formatCurrency(summary.totalOutstanding)}
                </span>
              </div>
            </div>

            {/* Customer Breakdown Stats */}
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                <span className="flex items-center space-x-1.5 text-gray-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>সম্পূর্ণ পরিশোধকারী গ্রাহক:</span>
                </span>
                <span className="font-bold text-gray-900">
                  {toBnNumber(summary.fullyPaidCount)} জন
                </span>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                <span className="flex items-center space-x-1.5 text-gray-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>আংশিক পরিশোধকারী গ্রাহক:</span>
                </span>
                <span className="font-bold text-gray-900">
                  {toBnNumber(summary.partialPaidCount)} জন
                </span>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                <span className="flex items-center space-x-1.5 text-gray-700 font-medium">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>বিল না দেওয়া গ্রাহক:</span>
                </span>
                <span className="font-bold text-gray-900">
                  {toBnNumber(summary.unpaidCount)} জন
                </span>
              </div>
            </div>
          </div>

          {/* Previous Month Carry-Forward Card */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>পূর্ববর্তী মাসের বকেয়া ব্যালেন্স ({formatYearMonth(prevMonthStr)})</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-800 block">পূর্ববর্তী মাসের বকেয়া</span>
                <span className="font-bold text-amber-900 text-sm mt-0.5 block">
                  {formatCurrency(prevSummary.totalOutstanding)}
                </span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-600 block">পূর্ববর্তী মাসে মোট আদায়</span>
                <span className="font-bold text-gray-800 text-sm mt-0.5 block">
                  {formatCurrency(prevSummary.totalCollected)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 20: Connection Line Status (লাইন চালু / বন্ধ) */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                <Power className="w-4 h-4 text-emerald-600" />
                <span>ইন্টারনেট সংযোগ স্ট্যাটাস (লাইন চালু / বন্ধ)</span>
              </h4>
              <span className="text-[10px] text-gray-500 font-medium">
                সর্বমোট {toBnNumber(customers.length)} জন
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-bold text-emerald-900">🟢 চালু লাইন</span>
                </div>
                <div className="text-base font-extrabold text-emerald-800 mt-1">
                  {toBnNumber(activeCustomersCount)} জন
                </div>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  নিয়মিত মাসিক বিল প্রযোজ্য
                </span>
              </div>

              <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-[11px] font-bold text-rose-900">🔴 বন্ধ লাইন</span>
                </div>
                <div className="text-base font-extrabold text-rose-800 mt-1">
                  {toBnNumber(inactiveCustomersCount)} জন
                </div>
                <span className="text-[10px] text-rose-700 block mt-0.5">
                  বিল বন্ধ, পূর্বের বকেয়া অক্ষুণ্ণ
                </span>
              </div>
            </div>
          </div>

          {/* Section 21: Monthly Billing Cycle Management & Audit */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-3.5 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  মাসিক বিলিং সাইকেল (অ্যাডমিন)
                </span>
                <h4 className="text-sm font-bold text-gray-900">
                  বর্তমান বিলিং মাস: {formatYearMonth(selectedMonth)}
                </h4>
              </div>

              <button
                onClick={() => setIsNewCycleModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>নতুন মাস শুরু</span>
              </button>
            </div>

            {/* Cycle summary info */}
            {cycleLogs.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-emerald-100">
                <div className="flex items-center justify-between text-[11px] text-gray-600">
                  <span className="font-semibold flex items-center space-x-1">
                    <History className="w-3.5 h-3.5 text-emerald-700" />
                    <span>সর্বশেষ বিলিং সাইকেল লগ:</span>
                  </span>
                  <span className="font-bold text-emerald-800">
                    {formatYearMonth(cycleLogs[0].targetMonth)}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">চালু লাইনে নতুন বিল:</span>
                    <span className="font-bold text-gray-800">
                      {toBnNumber(cycleLogs[0].activeCustomerCount)} জনে {formatCurrency(cycleLogs[0].newBillsTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">স্থগিত সংযোগ (বিলমুক্ত):</span>
                    <span className="font-bold text-rose-700">
                      {toBnNumber(cycleLogs[0].suspendedCustomerCount)} জন
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">পূর্ববর্তী মাসের বকেয়া ফরোয়ার্ড:</span>
                    <span className="font-bold text-amber-700">
                      {formatCurrency(cycleLogs[0].previousOutstanding)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-100 font-bold text-xs text-emerald-900">
                    <span>মোট আদায়যোগ্য পাওনা:</span>
                    <span>{formatCurrency(cycleLogs[0].totalReceivable)}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 pt-0.5">
                    চালুকারী: {cycleLogs[0].generatedBy} • {formatBnDate(cycleLogs[0].generatedAt, true)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: OUTSTANDING DUES MANAGEMENT */}
      {subTab === 'dues' && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={dueSearchQuery}
                onChange={(e) => setDueSearchQuery(e.target.value)}
                placeholder="বকেয়া গ্রাহকের নাম, মোবাইল বা আইডি খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={dueAreaFilter}
                onChange={(e) => setDueAreaFilter(e.target.value)}
                className="bg-gray-100 border-none text-xs rounded-xl px-2.5 py-1.5 font-medium text-gray-700"
              >
                <option value="all">সব এলাকা</option>
                {Array.from(new Set(customers.map((c) => c.area))).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              <select
                value={minDueFilter}
                onChange={(e) => setMinDueFilter(Number(e.target.value))}
                className="bg-gray-100 border-none text-xs rounded-xl px-2.5 py-1.5 font-medium text-gray-700"
              >
                <option value="0">সকল বকেয়া</option>
                <option value="500">৳৫০০ এর বেশি</option>
                <option value="1000">৳১,০০০ এর বেশি</option>
              </select>

              <span className="text-[11px] text-gray-500 ml-auto">
                মোট বকেয়া গ্রাহক: <strong className="text-gray-900">{toBnNumber(filteredOutstanding.length)}</strong> জন
              </span>
            </div>
          </div>

          {/* Dues List */}
          {filteredOutstanding.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center text-xs text-gray-400">
              কোনো বকেয়া গ্রাহক পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOutstanding.map(({ customer, totalDue, unpaidMonths, lastPaymentDate }) => (
                <div
                  key={customer.id}
                  className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-xs font-bold text-gray-900 leading-tight">
                        {customer.name}
                      </h4>
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-semibold">
                        {customer.memberId}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {customer.mobile} • {customer.area}
                    </div>

                    <div className="text-[10px] text-rose-600 font-semibold mt-1">
                      বকেয়া মাস: {unpaidMonths.map((m) => formatYearMonth(m)).join(', ')}
                    </div>

                    {lastPaymentDate && (
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        সর্বশেষ পরিশোধ: {formatBnDate(lastPaymentDate)}
                      </div>
                    )}
                  </div>

                  <div className="text-right flex flex-col items-end space-y-1.5">
                    <div className="text-sm font-bold text-rose-700">
                      {formatCurrency(totalDue)}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <a
                        href={`tel:${customer.mobile}`}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                        title="কল করুন"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setActiveTab('collection');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center space-x-1 active:scale-95 transition"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>আদায়</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: DATE-WISE COLLECTION */}
      {subTab === 'datewise' && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">
              তারিখ অনুযায়ী আদায় বিবরণী ({formatYearMonth(selectedMonth)})
            </h3>
            <span className="text-xs font-bold text-emerald-700">
              মোট: {formatCurrency(summary.totalCollected)}
            </span>
          </div>

          {dateWiseCollections.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              এই মাসে কোনো আদায়ের রেকর্ড নেই।
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {dateWiseCollections.map(({ date, total, count }) => (
                <div key={date} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-800">{formatBnDate(date)}</span>
                    <span className="text-[11px] text-gray-400 block">
                      {toBnNumber(count)} টি রসিদ কাটা হয়েছে
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: PAYMENT METHODS BREAKDOWN */}
      {subTab === 'methods' && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100">
            পেমেন্ট মাধ্যম অনুযায়ী বিশ্লেষণ ({formatYearMonth(selectedMonth)})
          </h3>

          <div className="space-y-3">
            {methodWiseCollections.map(({ method, label, total, count, percent }) => (
              <div key={method} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-800">
                    {label} ({toBnNumber(count)} টি রসিদ)
                  </span>
                  <span className="font-bold text-emerald-800">
                    {formatCurrency(total)} ({toBnNumber(percent)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: TRANSACTIONS & REVERSAL AUDIT */}
      {subTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-800">
              সকল কালেকশন লেনদেন ইতিহাস
            </span>
            <button
              onClick={handleExportHistory}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center space-x-1 hover:bg-emerald-100 border border-emerald-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>এক্সেল ডাউনলোড</span>
            </button>
          </div>

          <div className="space-y-2">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className={`bg-white p-3 rounded-2xl border shadow-xs text-xs space-y-1.5 ${
                  txn.isReversed ? 'border-rose-200 bg-rose-50/30 opacity-75' : 'border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-gray-900">{txn.customerName}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {txn.customerMemberId}
                      </span>
                      {txn.isReversed && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                          বাতিলকৃত
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      রসিদ নং: <span className="font-bold text-gray-700">{txn.receiptNo}</span> • ট্র্যাকিং: {txn.id}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-bold ${txn.isReversed ? 'line-through text-gray-400' : 'text-emerald-700'}`}>
                      {formatCurrency(txn.totalAmount)}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      {getPaymentMethodLabel(txn.paymentMethod)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                  <span>তারিখ: {formatBnDate(txn.timestamp, true)}</span>
                  <span>আদায়কারী: {txn.collectedBy}</span>
                </div>

                {txn.isReversed && (
                  <div className="bg-rose-100/60 p-2 rounded-xl text-[10px] text-rose-800">
                    বাতিলের কারণ: {txn.reversalReason} (তারিখ: {formatBnDate(txn.reversalDate || '')})
                  </div>
                )}

                {!txn.isReversed && (
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      onClick={() => {
                        const cust = customers.find((c) => c.id === txn.customerId);
                        const due = cust ? BillingService.getCustomerTotalDue(cust, billings, [selectedMonth]).totalDue : 0;
                        setActiveReceipt({
                          transaction: txn,
                          currentDue: due,
                          billingMonth: txn.targetMonths[0] || selectedMonth,
                        });
                      }}
                      className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[10px]"
                    >
                      রসিদ দেখুন
                    </button>

                    <button
                      onClick={() => setReversalTarget(txn)}
                      className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[10px] flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>সংশোধন / বাতিল</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: YEARLY SUMMARY */}
      {subTab === 'yearly' && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100">
            বাৎসরিক আর্থিক বিবরণী (মাস অনুযায়ী)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-[10px]">
                  <th className="py-2">মাস</th>
                  <th className="py-2 text-right">মোট বিল</th>
                  <th className="py-2 text-right">আদায়</th>
                  <th className="py-2 text-right">বকেয়া</th>
                  <th className="py-2 text-right">আদায় হার</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {yearlySummary.map((s) => (
                  <tr key={s.month} className="hover:bg-gray-50">
                    <td className="py-2 font-semibold text-gray-900">
                      {formatYearMonth(s.month)}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-700">
                      {formatCurrency(s.totalBills)}
                    </td>
                    <td className="py-2 text-right font-bold text-emerald-700">
                      {formatCurrency(s.totalCollected)}
                    </td>
                    <td className="py-2 text-right font-semibold text-rose-600">
                      {formatCurrency(s.totalOutstanding)}
                    </td>
                    <td className="py-2 text-right font-bold text-gray-800">
                      {toBnNumber(s.collectionPercentage)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Reversal / Correction Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-4 shadow-xl space-y-3">
            <h4 className="font-bold text-sm text-gray-900">
              লেনদেন বাতিল ও সংশোধন নিশ্চিতকরণ
            </h4>
            <p className="text-xs text-gray-600">
              আপনি <strong>{reversalTarget.customerName}</strong> এর <strong>{reversalTarget.receiptNo}</strong> (৳{reversalTarget.totalAmount}) বাতিল করতে চাচ্ছেন।
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl">
              সতর্কতা: এটি বাতিল করলে গ্রাহকের বকেয়া স্বয়ংক্রিয়ভাবে আবার যোগ হবে এবং অডিট ট্রেইলে সংরক্ষিত থাকবে।
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                বাতিলের কারণ লিখুন *
              </label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="যেমন: ভুল গ্রাহকে পেমেন্ট এন্ট্রি বা ভুল টাকার অঙ্ক..."
                rows={3}
                required
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setReversalTarget(null)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmReversal}
                disabled={!reversalReason.trim()}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
