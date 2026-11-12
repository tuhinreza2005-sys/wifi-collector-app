import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Edit3, 
  CreditCard, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Receipt,
  User,
  History,
  ExternalLink,
  Power,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, MonthBillingRecord } from '../../types';
import { BillingService } from '../../services/billing';
import { LineStatusModal } from './LineStatusModal';
import { 
  formatCurrency, 
  toBnNumber, 
  formatYearMonth, 
  formatBnDate, 
  getPaymentMethodLabel 
} from '../../utils/bengali';

interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
  onEdit,
}) => {
  const { billings, setActiveTab, setSelectedCustomer, setActiveReceipt, selectedMonth } = useApp();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(selectedMonth);
  const [isLineModalOpen, setIsLineModalOpen] = useState<boolean>(false);

  if (!customer) return null;

  const months = BillingService.getMonthsForYear(selectedYear);
  const allMonthsForOverview = [
    '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'
  ];

  // Comprehensive Customer Billing Overview (Section 22)
  const billingOverview = BillingService.getCustomerBillingOverview(
    customer,
    selectedMonth,
    billings,
    allMonthsForOverview
  );

  // Calculate total due across all months
  const dueInfo = BillingService.getCustomerTotalDue(customer, billings, months);

  const handleStartCollection = () => {
    setSelectedCustomer(customer);
    setActiveTab('collection');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
        
        {/* Top Header Card */}
        <div className={`text-white p-4 relative ${customer.status === 'active' ? 'bg-gradient-to-r from-emerald-700 to-teal-800' : 'bg-gradient-to-r from-rose-800 to-slate-900'}`}>
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-start space-x-3 pr-8">
            <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-xl font-bold shadow-inner shrink-0">
              {customer.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold leading-tight">{customer.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                    customer.status === 'active'
                      ? 'bg-emerald-400 text-emerald-950'
                      : 'bg-rose-400 text-rose-950'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${customer.status === 'active' ? 'bg-emerald-900' : 'bg-rose-900'} mr-1`}></span>
                  {customer.status === 'active' ? '🟢 লাইন চালু' : '🔴 লাইন বন্ধ'}
                </span>
              </div>
              <p className="text-white/80 text-xs mt-0.5 font-medium">
                আইডি: <span className="font-bold text-white">{customer.memberId}</span> • প্যাকেজ: {customer.packageName}
              </p>
              <p className="text-white/70 text-xs flex items-center mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                {customer.area}, {customer.address}
              </p>
            </div>
          </div>

          {/* Action Row (Call, WhatsApp, Edit, Line Status Toggle, Collect) */}
          <div className="grid grid-cols-5 gap-1.5 mt-4 pt-3 border-t border-white/15">
            <a
              href={`tel:${customer.mobile}`}
              className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl flex flex-col items-center justify-center text-[10px] font-semibold transition active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 mb-0.5 text-emerald-200" />
              <span>কল</span>
            </a>

            <a
              href={`https://wa.me/88${customer.mobile}`}
              target="_blank"
              rel="noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl flex flex-col items-center justify-center text-[10px] font-semibold transition active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 mb-0.5 text-emerald-200" />
              <span>হোয়াটসঅ্যাপ</span>
            </a>

            <button
              onClick={() => onEdit(customer)}
              className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl flex flex-col items-center justify-center text-[10px] font-semibold transition active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 mb-0.5 text-emerald-200" />
              <span>সম্পাদনা</span>
            </button>

            <button
              onClick={() => setIsLineModalOpen(true)}
              className={`py-2 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold shadow-xs transition active:scale-95 ${
                customer.status === 'active'
                  ? 'bg-rose-500/80 hover:bg-rose-500 text-white'
                  : 'bg-emerald-500/80 hover:bg-emerald-500 text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5 mb-0.5" />
              <span>{customer.status === 'active' ? 'লাইন বন্ধ' : 'লাইন চালু'}</span>
            </button>

            <button
              onClick={handleStartCollection}
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 py-2 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold shadow-md transition active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5 mb-0.5" />
              <span>বিল নিন</span>
            </button>
          </div>
        </div>

        {/* Section 22: Comprehensive Customer Billing Status Card */}
        <div className="bg-gray-50 p-3.5 border-b border-gray-200 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-gray-200">
            <span className="font-bold text-gray-800 flex items-center space-x-1.5">
              <Wallet className="w-4 h-4 text-emerald-700" />
              <span>গ্রাহক বিলিং অবস্থা ও বিবরণী</span>
            </span>
            <span className="text-[11px] text-gray-500">
              বিলের মাস: <strong className="text-gray-900">{formatYearMonth(selectedMonth)}</strong>
            </span>
          </div>

          {/* Connection and Suspension Metadata */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded-xl border border-gray-100">
              <span className="text-gray-500 block text-[10px]">সংযোগ শুরুর তারিখ</span>
              <span className="font-semibold text-gray-800">{formatBnDate(customer.connectionDate)}</span>
            </div>

            <div className={`p-2 rounded-xl border ${customer.status === 'active' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50 border-rose-200'}`}>
              <span className="block text-[10px] font-semibold text-gray-600">
                {customer.status === 'active' ? 'ইন্টারনেট লাইন অবস্থা' : 'লাইন বন্ধের তথ্য'}
              </span>
              {customer.status === 'active' ? (
                <span className="font-bold text-emerald-800">🟢 সক্রিয় (সচল সংযোগ)</span>
              ) : (
                <div>
                  <span className="font-bold text-rose-700 block">🔴 স্থগিত ({formatBnDate(customer.suspensionDate || '')})</span>
                  {customer.suspensionReason && (
                    <span className="text-[9.5px] text-rose-600 block line-clamp-1">{customer.suspensionReason}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown Grid (চলতি বিল, পূর্বের বকেয়া, মোট পাওনা, পরিশোধিত, অবশিষ্ট) */}
          <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-600">চলতি মাসের বিল ({formatYearMonth(selectedMonth)}):</span>
              <span className="font-bold text-gray-900">
                {customer.status === 'active' ? formatCurrency(billingOverview.currentMonthBill) : '৳০ (লাইন বন্ধ)'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">পূর্ববর্তী মাসের বকেয়া:</span>
              <span className="font-bold text-rose-600">
                {formatCurrency(billingOverview.previousOutstanding)}
              </span>
            </div>

            <div className="flex justify-between pt-1 border-t border-gray-100 font-semibold text-gray-800">
              <span>মোট প্রদেয় বিল (পূর্ববর্তী বকেয়া + চলতি বিল):</span>
              <span className="font-bold text-emerald-800">
                {formatCurrency(billingOverview.totalPayable)}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>সর্বমোট পরিশোধিত টাকা (পরিশোধ):</span>
              <span className="font-bold text-emerald-700">
                {formatCurrency(billingOverview.totalPaidAllTime)}
              </span>
            </div>

            <div className="flex justify-between pt-1 border-t border-dashed border-gray-200 font-bold text-xs">
              <span className="text-gray-800">সর্বমোট অবশিষ্ট বকেয়া ব্যালেন্স:</span>
              <span className={billingOverview.remainingDueTotal > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                {formatCurrency(billingOverview.remainingDueTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Year Filter Header */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>মাসিক বিলিং ক্যালেন্ডার ({toBnNumber(selectedYear)})</span>
          </div>
          <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg p-0.5">
            {[2025, 2026, 2027].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2 py-0.5 text-xs rounded font-semibold transition ${
                  selectedYear === yr
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {toBnNumber(yr)}
              </button>
            ))}
          </div>
        </div>

        {/* 12-Month Calendar List */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1 bg-gray-50/50">
          {months.map((ym) => {
            const billRecord = BillingService.getOrCreateMonthBilling(customer, ym, billings);
            const isExpanded = expandedMonth === ym;

            // Status Styling
            let statusBadge = (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <XCircle className="w-3 h-3 mr-1" />
                বকেয়া
              </span>
            );

            let borderStyle = 'border-rose-200 bg-white';

            if (billRecord.status === 'paid') {
              statusBadge = (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  পরিশোধিত
                </span>
              );
              borderStyle = 'border-emerald-200 bg-white';
            } else if (billRecord.status === 'partial') {
              statusBadge = (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  আংশিক পরিশোধ
                </span>
              );
              borderStyle = 'border-amber-200 bg-white';
            }

            return (
              <div
                key={ym}
                className={`rounded-2xl border ${borderStyle} shadow-xs p-3 transition`}
              >
                {/* Month Summary Bar */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedMonth(isExpanded ? null : ym)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-900">
                      {formatYearMonth(ym)}
                    </span>
                    {statusBadge}
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-900">
                      বিল: {formatCurrency(billRecord.netBill)}
                    </div>
                    {billRecord.dueAmount > 0 ? (
                      <div className="text-[11px] font-semibold text-rose-600">
                        বকেয়া: {formatCurrency(billRecord.dueAmount)}
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-emerald-600">
                        সম্পূর্ণ পরিশোধ
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Payment History for this Month */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-700 space-y-2 animate-in fade-in">
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded-xl text-center">
                      <div>
                        <span className="text-[10px] text-gray-400 block">মোট বিল</span>
                        <span className="font-bold">{formatCurrency(billRecord.netBill)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">আদায় হয়েছে</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(billRecord.paidAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">অবশিষ্ট বকেয়া</span>
                        <span className="font-bold text-rose-600">{formatCurrency(billRecord.dueAmount)}</span>
                      </div>
                    </div>

                    {/* Payment Transactions Breakdown */}
                    <div className="space-y-1.5 mt-2">
                      <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-500">
                        <History className="w-3.5 h-3.5" />
                        <span>পরিশোধের ইতিহাস ({toBnNumber(billRecord.payments.length)} টি লেনদেন)</span>
                      </div>

                      {billRecord.payments.length === 0 ? (
                        <div className="text-gray-400 text-[11px] py-1 italic">
                          এই মাসে কোনো বিল পরিশোধ করা হয়নি।
                        </div>
                      ) : (
                        billRecord.payments.map((p, idx) => (
                          <div
                            key={idx}
                            className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-emerald-900 text-xs">
                                +{formatCurrency(p.amount)} ({getPaymentMethodLabel(p.paymentMethod)})
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {formatBnDate(p.date, true)} • রসিদ: {p.receiptNo}
                              </div>
                            </div>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-semibold text-emerald-800 border border-emerald-200">
                              আদায়কারী: {p.collectedBy}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick collect button for this month if due */}
                    {billRecord.dueAmount > 0 && (
                      <div className="pt-1">
                        <button
                          onClick={handleStartCollection}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition active:scale-98"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>এই মাসের {formatCurrency(billRecord.dueAmount)} বিল আদায় করুন</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Line Suspension & Reactivation Modal */}
        <LineStatusModal
          customer={customer}
          isOpen={isLineModalOpen}
          onClose={() => setIsLineModalOpen(false)}
        />

      </div>
    </div>
  );
};
