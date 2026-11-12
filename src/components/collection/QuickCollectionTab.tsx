import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  CreditCard, 
  Check, 
  User, 
  Calendar, 
  DollarSign, 
  Wallet, 
  AlertCircle, 
  Phone, 
  MapPin, 
  ChevronRight,
  Clock,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, PaymentMethod } from '../../types';
import { BillingService } from '../../services/billing';
import { 
  formatCurrency, 
  toBnNumber, 
  normalizeSearch, 
  formatYearMonth, 
  getPaymentMethodLabel 
} from '../../utils/bengali';

export const QuickCollectionTab: React.FC = () => {
  const { 
    customers, 
    billings, 
    selectedCustomer, 
    setSelectedCustomer, 
    selectedMonth, 
    recordPayment 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([selectedMonth]);
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Available months to collect (past 3 months + current + next month)
  const candidateMonths = ['2026-09', '2026-10', '2026-11', '2026-12'];

  // Auto-fill when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      const bill = BillingService.getOrCreateMonthBilling(selectedCustomer, selectedMonth, billings);
      const dueToPay = bill.dueAmount > 0 ? bill.dueAmount : selectedCustomer.monthlyBill;
      setAmountInput(String(dueToPay));
      setSelectedMonths([selectedMonth]);
      setErrorMsg('');
    } else {
      setAmountInput('');
    }
  }, [selectedCustomer, selectedMonth, billings]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeSearch(searchQuery);

    return customers
      .filter((c) => {
        const matchName = normalizeSearch(c.name).includes(q);
        const matchMobile = normalizeSearch(c.mobile).includes(q);
        const matchAlt = c.alternateMobile ? normalizeSearch(c.alternateMobile).includes(q) : false;
        const matchId = normalizeSearch(c.memberId).includes(q);
        return matchName || matchMobile || matchAlt || matchId;
      })
      .slice(0, 10);
  }, [customers, searchQuery]);

  const toggleMonthSelection = (ym: string) => {
    if (selectedMonths.includes(ym)) {
      if (selectedMonths.length > 1) {
        const next = selectedMonths.filter((m) => m !== ym);
        setSelectedMonths(next);
        recalcAutoAmount(next);
      }
    } else {
      const next = [...selectedMonths, ym].sort();
      setSelectedMonths(next);
      recalcAutoAmount(next);
    }
  };

  const recalcAutoAmount = (monthsList: string[]) => {
    if (!selectedCustomer) return;
    let totalDue = 0;
    monthsList.forEach((m) => {
      const bill = BillingService.getOrCreateMonthBilling(selectedCustomer, m, billings);
      totalDue += bill.dueAmount > 0 ? bill.dueAmount : selectedCustomer.monthlyBill;
    });
    setAmountInput(String(totalDue));
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCustomer) {
      setErrorMsg('অনুগ্রহ করে একজন গ্রাহক নির্বাচন করুন');
      return;
    }

    const payAmount = parseFloat(amountInput);
    if (isNaN(payAmount) || payAmount <= 0) {
      setErrorMsg('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    if (selectedMonths.length === 0) {
      setErrorMsg('অন্তত একটি বিলের মাস নির্বাচন করুন');
      return;
    }

    setIsSubmitting(true);

    try {
      // Allocate payment across selected months proportionally or consecutively
      let remainingToAllocate = payAmount;
      const allocations: { yearMonth: string; amount: number }[] = [];

      selectedMonths.forEach((ym, idx) => {
        if (remainingToAllocate <= 0) return;
        const bill = BillingService.getOrCreateMonthBilling(selectedCustomer, ym, billings);
        const needed = bill.dueAmount > 0 ? bill.dueAmount : bill.netBill;

        // If last month in list, put all remaining
        if (idx === selectedMonths.length - 1) {
          allocations.push({ yearMonth: ym, amount: remainingToAllocate });
          remainingToAllocate = 0;
        } else {
          const alloc = Math.min(needed, remainingToAllocate);
          allocations.push({ yearMonth: ym, amount: alloc });
          remainingToAllocate -= alloc;
        }
      });

      // Execute transaction via AppContext
      recordPayment({
        customer: selectedCustomer,
        allocations,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'বিল কালেকশনে সমস্যা হয়েছে!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethodsList: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: 'cash', label: 'নগদ টাকা (Cash)', icon: '💵' },
    { id: 'bkash', label: 'বিকাশ (bKash)', icon: '📱' },
    { id: 'nagad', label: 'নগদ (Nagad)', icon: '📲' },
    { id: 'rocket', label: 'রকেট (Rocket)', icon: '🚀' },
    { id: 'bank', label: 'ব্যাংক ট্রান্সফার', icon: '🏦' },
    { id: 'other', label: 'অন্যান্য', icon: '📝' },
  ];

  return (
    <div className="space-y-3 pb-24 pt-1">
      
      {/* Title */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">
              দ্রুত বিল কালেকশন
            </h2>
            <p className="text-[10px] text-gray-500">গ্রাহকের কাছে তাৎক্ষণিক ডিজিটাল রসিদ প্রদান করুন</p>
          </div>
        </div>
        {selectedCustomer && (
          <button
            onClick={() => setSelectedCustomer(null)}
            className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg hover:bg-rose-100"
          >
            গ্রাহক পরিবর্তন
          </button>
        )}
      </div>

      {/* Step 1: Customer Search or Selected Profile */}
      {!selectedCustomer ? (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
            <Search className="w-4 h-4 text-emerald-600" />
            <span>১. গ্রাহক নির্বাচন করুন (Search Customer)</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মোবাইল নম্বর, আইডি (যেমন WF-101) বা নাম লিখুন..."
              autoFocus
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-emerald-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Quick List of Search Matches */}
          {searchQuery && (
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">
                  কোনো গ্রাহক মেলেনি
                </div>
              ) : (
                searchResults.map((cust) => {
                  const bill = BillingService.getOrCreateMonthBilling(cust, selectedMonth, billings);
                  return (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className="p-3 hover:bg-emerald-50/70 transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                          {cust.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900 leading-tight">
                            {cust.name}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {cust.memberId} • {cust.mobile} • {cust.area}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-rose-600">
                          বকেয়া: {formatCurrency(bill.dueAmount)}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          বিল: {formatCurrency(cust.monthlyBill)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Popular / Quick pick instructions */}
          {!searchQuery && (
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center text-xs text-emerald-900 space-y-1">
              <p className="font-semibold">গ্রাহকের মোবাইল বা মেম্বার আইডি টাইপ করুন</p>
              <p className="text-[11px] text-emerald-700">
                অথবা &apos;গ্রাহক&apos; ট্যাব থেকে যেকোনো গ্রাহকের &apos;বিল আদায়&apos; বাটনে চাপুন
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Selected Customer Summary Card */
        <div className="bg-emerald-800 text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-lg font-bold">
                {selectedCustomer.name.slice(0, 1)}
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">
                  {selectedCustomer.name}
                </h3>
                <p className="text-emerald-100 text-xs mt-0.5">
                  আইডি: {selectedCustomer.memberId} • মোবাইল: {selectedCustomer.mobile}
                </p>
                <p className="text-emerald-200 text-[11px] flex items-center mt-0.5">
                  <MapPin className="w-3 h-3 mr-0.5" />
                  {selectedCustomer.area}, {selectedCustomer.address}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                {selectedCustomer.packageName}
              </span>
              <div className="text-sm font-bold text-emerald-200 mt-1">
                মাসিক বিল: {formatCurrency(selectedCustomer.monthlyBill)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Collection Payment Form (When customer is selected) */}
      {selectedCustomer && (
        <form onSubmit={handleConfirmPayment} className="space-y-3">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Month Selector */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>২. বিলের মাস নির্বাচন করুন (এক বা একাধিক)</span>
              </span>
              <span className="text-[11px] text-gray-500">
                {toBnNumber(selectedMonths.length)} টি মাস নির্বাচিত
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {candidateMonths.map((ym) => {
                const bill = BillingService.getOrCreateMonthBilling(selectedCustomer, ym, billings);
                const isSelected = selectedMonths.includes(ym);

                return (
                  <button
                    type="button"
                    key={ym}
                    onClick={() => toggleMonthSelection(ym)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        {formatYearMonth(ym)}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        বিল: {formatCurrency(bill.netBill)}
                      </div>
                    </div>
                    <div className="text-right">
                      {bill.status === 'paid' ? (
                        <span className="text-[10px] font-bold text-emerald-600 block">
                          পরিশোধিত
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 block">
                          বকেয়া: {formatCurrency(bill.dueAmount)}
                        </span>
                      )}
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ml-auto mt-0.5 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Received Input */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>৩. আদায়কৃত টাকার পরিমাণ (Amount Received) *</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                আংশিক পেমেন্ট সমর্থিত
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-3 text-2xl font-bold text-emerald-700">
                ৳
              </span>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0"
                min="1"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-emerald-400 rounded-2xl text-2xl font-black text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Amount Suggestion Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => recalcAutoAmount(selectedMonths)}
                className="py-1.5 px-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition"
              >
                পুরো বিল
              </button>
              <button
                type="button"
                onClick={() => setAmountInput('500')}
                className="py-1.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition"
              >
                ৳৫০০
              </button>
              <button
                type="button"
                onClick={() => setAmountInput('600')}
                className="py-1.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition"
              >
                ৳৬০০
              </button>
              <button
                type="button"
                onClick={() => setAmountInput('1000')}
                className="py-1.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition"
              >
                ৳১,০০০
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <span className="font-bold text-xs text-gray-700 flex items-center space-x-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>৪. পেমেন্ট মাধ্যম নির্বাচন করুন *</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              {paymentMethodsList.map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm font-bold scale-[1.02]'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium'
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span className="text-[11px] leading-tight line-clamp-1">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes / Collector Remarks */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="মন্তব্য (যেমন: বিকাশ ট্রানজেকশন আইডি বা অন্য কিছু)..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Big Green Confirm Payment Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4 px-4 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 text-base"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>
                {isSubmitting
                  ? 'বিল জমা হচ্ছে...'
                  : `টাকা আদায় নিশ্চিত করুন (${amountInput ? formatCurrency(Number(amountInput)) : '৳০'})`}
              </span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
