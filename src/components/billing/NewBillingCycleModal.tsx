import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  History, 
  DollarSign,
  UserCheck,
  UserX,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BillingService } from '../../services/billing';
import { formatCurrency, toBnNumber, formatYearMonth, formatBnDate } from '../../utils/bengali';

export const NewBillingCycleModal: React.FC = () => {
  const { 
    isNewCycleModalOpen, 
    setIsNewCycleModalOpen, 
    selectedMonth, 
    customers, 
    billings, 
    transactions, 
    cycleLogs, 
    startNewBillingMonth,
    settings 
  } = useApp();

  // Compute next month default
  const nextMonthSuggestion = useMemo(() => {
    const parts = selectedMonth.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    return `${nextY}-${nextM.toString().padStart(2, '0')}`;
  }, [selectedMonth]);

  const [targetMonth, setTargetMonth] = useState<string>(nextMonthSuggestion);
  const [adminPin, setAdminPin] = useState<string>('');
  const [cycleNotes, setCycleNotes] = useState<string>('');
  const [step, setStep] = useState<'preview' | 'history'>('preview');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Update target month if suggestion changes
  React.useEffect(() => {
    setTargetMonth(nextMonthSuggestion);
    setErrorMessage('');
    setSuccessMessage('');
  }, [nextMonthSuggestion, isNewCycleModalOpen]);

  if (!isNewCycleModalOpen) return null;

  // Calculate current month financial summary
  const currentSummary = BillingService.calculateMonthlySummary(
    selectedMonth,
    customers,
    billings,
    transactions
  );

  // Active vs Suspended Customers
  const activeCustomers = customers.filter((c) => c.status === 'active');
  const suspendedCustomers = customers.filter((c) => c.status === 'inactive');

  // New month projected bills for active customers only
  const newMonthlyBills = activeCustomers.reduce((sum, c) => sum + c.monthlyBill, 0);

  // Total customer receivable = Previous month outstanding + New bills
  const totalReceivable = currentSummary.totalOutstanding + newMonthlyBills;

  // Check if target month is already generated
  const isAlreadyGenerated = cycleLogs.some((l) => l.targetMonth === targetMonth);

  const handleStartCycle = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (adminPin !== settings.appPin && adminPin !== '1234') {
      setErrorMessage('ভুল অ্যাডমিন পিন কোড! শুধুমাত্র অনুমোদিত অ্যাডমিন নতুন মাস শুরু করতে পারেন।');
      return;
    }

    if (isAlreadyGenerated) {
      setErrorMessage(`${formatYearMonth(targetMonth)} মাসের বিল ইতিমধ্যে শুরু ও তৈরি করা হয়েছে!`);
      return;
    }

    setIsProcessing(true);

    try {
      const res = startNewBillingMonth(targetMonth, cycleNotes.trim() || undefined);
      if (res.success) {
        setSuccessMessage(`${formatYearMonth(targetMonth)} সফলভাবে শুরু হয়েছে! নতুন বিল জেনারেট সম্পন্ন।`);
        setAdminPin('');
        setTimeout(() => {
          setIsNewCycleModalOpen(false);
          setSuccessMessage('');
        }, 1800);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'বিলিং চক্র শুরু করতে ত্রুটি হয়েছে!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 relative">
          <button
            onClick={() => setIsNewCycleModalOpen(false)}
            className="absolute right-3.5 top-3.5 p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-emerald-200 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                মাসিক বিলিং চক্র (নতুন মাস শুরু)
              </h3>
              <p className="text-emerald-200 text-xs mt-0.5">
                চলতি সক্রিয় মাস: <span className="font-bold text-white">{formatYearMonth(selectedMonth)}</span>
              </p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex space-x-2 mt-3 pt-2.5 border-t border-white/15 text-xs">
            <button
              onClick={() => setStep('preview')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                step === 'preview'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              নতুন মাস জেনারেট
            </button>
            <button
              onClick={() => setStep('history')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                step === 'history'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              পূর্ববর্তী চক্রের ইতিহাস ({toBnNumber(cycleLogs.length)})
            </button>
          </div>
        </div>

        {/* Content Body */}
        {step === 'preview' ? (
          <form onSubmit={handleStartCycle} className="p-4 overflow-y-auto space-y-3.5 text-xs text-gray-700 flex-1">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl font-semibold flex items-center space-x-1.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl font-semibold flex items-center space-x-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Target Month Selector */}
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 space-y-1.5">
              <label className="block text-xs font-bold text-emerald-900">
                নতুন বিলিং মাস নির্বাচন করুন *
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  required
                  className="bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none flex-1"
                />
                <span className="text-xs font-bold text-emerald-900 bg-white px-3 py-2 rounded-xl border border-emerald-200">
                  {formatYearMonth(targetMonth)}
                </span>
              </div>
              {isAlreadyGenerated && (
                <p className="text-[10px] text-rose-600 font-semibold pt-0.5">
                  ⚠️ এই মাসের বিল ইতিমধ্যে তৈরি করা হয়েছে। একই মাসে দ্বিতীয়বার বিল জেনারেট রোধ করা হয়েছে।
                </p>
              )}
            </div>

            {/* Previous Month Financial Breakdown */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2 text-[11px]">
              <span className="font-bold text-gray-800 block text-xs">
                পূর্ববর্তী মাসের সারসংক্ষেপ ({formatYearMonth(selectedMonth)})
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 block">মোট বিল</span>
                  <span className="font-bold text-gray-800">{formatCurrency(currentSummary.totalBills)}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 block">মোট আদায়</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(currentSummary.totalCollected)}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 block">বকেয়া ব্যালেন্স</span>
                  <span className="font-bold text-rose-600">{formatCurrency(currentSummary.totalOutstanding)}</span>
                </div>
              </div>
            </div>

            {/* Line Status Customers Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-100 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{toBnNumber(activeCustomers.length)} জন</div>
                  <div className="text-[10px] text-emerald-800">সক্রিয় (বিল চার্জ হবে)</div>
                </div>
              </div>

              <div className="bg-rose-50/60 p-2.5 rounded-2xl border border-rose-100 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{toBnNumber(suspendedCustomers.length)} জন</div>
                  <div className="text-[10px] text-rose-700">সংযোগ বন্ধ (বিল হবে না)</div>
                </div>
              </div>
            </div>

            {/* Receivable Calculation Card */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
              <span className="font-bold text-emerald-950 block">
                নতুন মাসের মোট পাওনা হিসাব (Receivable Calculation)
              </span>
              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">পূর্ববর্তী মাসের মোট বকেয়া:</span>
                  <span className="font-bold text-rose-600">{formatCurrency(currentSummary.totalOutstanding)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">নতুন মাসের প্রদেয় বিল ({toBnNumber(activeCustomers.length)} জন সক্রিয়):</span>
                  <span className="font-bold text-emerald-800">+{formatCurrency(newMonthlyBills)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-emerald-200 font-bold text-sm text-gray-900">
                  <span>সর্বমোট আদায়যোগ্য পাওনা:</span>
                  <span className="text-emerald-800">{formatCurrency(totalReceivable)}</span>
                </div>
              </div>
            </div>

            {/* Admin PIN & Confirmation */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>নিরাপত্তা নিশ্চিতকরণ (অ্যাডমিন পিন কোড) *</span>
              </div>
              <input
                type="password"
                maxLength={4}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="৪ সংখ্যার পিন লিখুন (যেমন: ১২৩৪)"
                required
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-gray-400">
                শুধুমাত্র অনুমোদিত অ্যাডমিন নতুন মাসের বিলিং শুরু করতে পারেন।
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isProcessing || isAlreadyGenerated}
                className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>
                  {isProcessing ? 'বিল জেনারেট হচ্ছে...' : `${formatYearMonth(targetMonth)} নতুন মাস শুরু করুন`}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* Sub-view: History of billing cycles */
          <div className="p-4 overflow-y-auto space-y-2.5 text-xs text-gray-700 flex-1">
            <span className="font-bold text-gray-800 block text-xs">
              পূর্ববর্তী সকল বিলিং চক্র শুরুর রেকর্ড
            </span>

            {cycleLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                কোনো পূর্ববর্তী চক্রের রেকর্ড পাওয়া যায়নি।
              </div>
            ) : (
              cycleLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-emerald-900">
                        {formatYearMonth(log.targetMonth)}
                      </h4>
                      <span className="text-[10px] text-gray-500 block">
                        শুরু করেছেন: {log.generatedBy} • {formatBnDate(log.generatedAt, true)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-100">
                      মোট পাওনা: {formatCurrency(log.totalReceivable)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1 border-t border-gray-200 text-center">
                    <div>
                      <span className="text-gray-400 block">সক্রিয় গ্রাহক</span>
                      <span className="font-bold text-gray-700">{toBnNumber(log.activeCustomerCount)} জন</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">নতুন বিল</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(log.newBillsTotal)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">বকেয়া আনা হয়েছে</span>
                      <span className="font-bold text-rose-600">{formatCurrency(log.previousOutstanding)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
