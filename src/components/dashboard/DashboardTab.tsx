import React from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Calendar, 
  ArrowRight,
  Receipt,
  UserCheck,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BillingService } from '../../services/billing';
import { formatCurrency, toBnNumber, formatYearMonth, formatBnDate, getPaymentMethodLabel } from '../../utils/bengali';

export const DashboardTab: React.FC = () => {
  const { 
    customers, 
    billings, 
    transactions, 
    expenses, 
    selectedMonth, 
    setActiveTab, 
    setActiveReceipt,
    setIsNewCycleModalOpen 
  } = useApp();

  const summary = BillingService.calculateMonthlySummary(
    selectedMonth,
    customers,
    billings,
    transactions
  );

  // Calculate monthly expenses
  const currentMonthExpenses = expenses
    .filter((e) => e.month === selectedMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = summary.totalCollected - currentMonthExpenses;

  // Recent 5 transactions
  const recentTransactions = transactions
    .filter((t) => !t.isReversed)
    .slice(0, 5);

  return (
    <div className="space-y-4 pb-24 pt-2">
      
      {/* Monthly Billing Cycle Management Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight block">
              চলতি বিলিং মাস: {formatYearMonth(selectedMonth)}
            </span>
            <h3 className="text-xs font-bold text-gray-900 leading-tight">
              নতুন মাসের বিল জেনারেট করবেন?
            </h3>
          </div>
        </div>

        <button
          onClick={() => setIsNewCycleModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition"
        >
          <span>নতুন মাস শুরু</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Quick Field Collection Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-emerald-100 mb-1">
            ফিল্ড কালেকশন সহকারী
          </span>
          <h2 className="text-xl font-bold">
            বিল আদায় করতে চান?
          </h2>
          <p className="text-xs text-emerald-100 mt-0.5 mb-3">
            গ্রাহকের নাম, মোবাইল বা মেম্বার আইডি দিয়ে দ্রুত রসিদ কাটুন
          </p>
          <button
            onClick={() => setActiveTab('collection')}
            className="w-full bg-white hover:bg-emerald-50 text-emerald-800 font-bold py-2.5 px-4 rounded-xl shadow transition active:scale-[0.98] flex items-center justify-center space-x-2 text-sm"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>দ্রুত বিল কালেকশন করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* Main Financial 3-Card Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* এই মাসের মোট বিল */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-1 text-gray-500 mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[11px] font-medium">এই মাসের মোট বিল</span>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {formatCurrency(summary.totalBills)}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {toBnNumber(customers.length)} জন গ্রাহক
            </div>
          </div>
        </div>

        {/* এই মাসে মোট আদায় */}
        <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-1 text-emerald-700 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-medium">মোট আদায়</span>
          </div>
          <div>
            <div className="text-base font-bold text-emerald-700 leading-tight">
              {formatCurrency(summary.totalCollected)}
            </div>
            <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">
              {toBnNumber(summary.collectionPercentage)}% সংগৃহীত
            </div>
          </div>
        </div>

        {/* এই মাসের মোট বকেয়া */}
        <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-1 text-rose-700 mb-1">
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[11px] font-medium">মোট বকেয়া</span>
          </div>
          <div>
            <div className="text-base font-bold text-rose-700 leading-tight">
              {formatCurrency(summary.totalOutstanding)}
            </div>
            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
              বকেয়া পাওনা
            </div>
          </div>
        </div>
      </div>

      {/* Collection Progress Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-gray-700">
            {formatYearMonth(selectedMonth)} কালেকশন অগ্রগতি
          </span>
          <span className="font-bold text-emerald-700">
            {toBnNumber(summary.collectionPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, summary.collectionPercentage)}%` }}
          />
        </div>
      </div>

      {/* Customer Status Breakdown Cards (সম্পূর্ণ পরিশোধ, আংশিক, বকেয়া, আজকের আদায়) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* সম্পূর্ণ পরিশোধকারী */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 leading-tight">
              {toBnNumber(summary.fullyPaidCount)} <span className="text-xs font-normal text-gray-500">জন</span>
            </div>
            <div className="text-[11px] text-gray-600">সম্পূর্ণ পরিশোধকারী</div>
          </div>
        </div>

        {/* আংশিক পরিশোধকারী */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 leading-tight">
              {toBnNumber(summary.partialPaidCount)} <span className="text-xs font-normal text-gray-500">জন</span>
            </div>
            <div className="text-[11px] text-gray-600">আংশিক পরিশোধকারী</div>
          </div>
        </div>

        {/* বিল না দেওয়া গ্রাহক */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 leading-tight">
              {toBnNumber(summary.unpaidCount)} <span className="text-xs font-normal text-gray-500">জন</span>
            </div>
            <div className="text-[11px] text-gray-600">বিল না দেওয়া গ্রাহক</div>
          </div>
        </div>

        {/* আজকের মোট কালেকশন */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-teal-800 leading-tight">
              {formatCurrency(summary.todayCollected)}
            </div>
            <div className="text-[11px] text-gray-600">আজকের মোট কালেকশন</div>
          </div>
        </div>
      </div>

      {/* Monthly Net Balance (Income vs Expenses) */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>মাসিক লাভ-ক্ষতি হিসাব ({formatYearMonth(selectedMonth)})</span>
          <span className="text-[11px] text-emerald-600 font-semibold cursor-pointer" onClick={() => setActiveTab('reports')}>
            বিস্তারিত রিপোর্ট &rarr;
          </span>
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
          <div>
            <div className="text-[10px] text-gray-500">মোট আদায়</div>
            <div className="text-xs font-bold text-emerald-700 mt-0.5">
              {formatCurrency(summary.totalCollected)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">মোট ব্যয়</div>
            <div className="text-xs font-bold text-rose-600 mt-0.5">
              {formatCurrency(currentMonthExpenses)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">নিট ব্যালেন্স</div>
            <div className={`text-xs font-bold mt-0.5 ${netBalance >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
              {formatCurrency(netBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Collections Feed */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>সাম্প্রতিক আদায়কৃত রসিদ</span>
          </h3>
          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs text-emerald-700 font-semibold hover:underline"
          >
            সব দেখুন
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs">
            এখনও কোনো বিল আদায়ের রেকর্ড নেই
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="py-2.5 flex items-center justify-between hover:bg-gray-50/60 transition rounded-lg px-1 cursor-pointer"
                onClick={() => {
                  const cust = customers.find((c) => c.id === txn.customerId);
                  const custDue = cust ? BillingService.getCustomerTotalDue(cust, billings, [selectedMonth]).totalDue : 0;
                  setActiveReceipt({
                    transaction: txn,
                    currentDue: custDue,
                    billingMonth: txn.targetMonths[0] || selectedMonth,
                  });
                }}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 leading-tight">
                      {txn.customerName}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {txn.customerMemberId} • {getPaymentMethodLabel(txn.paymentMethod)} • {formatBnDate(txn.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-700">
                    +{formatCurrency(txn.totalAmount)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {txn.receiptNo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
