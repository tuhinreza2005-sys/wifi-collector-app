import React, { useState } from 'react';
import { 
  X, 
  Power, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  UserX, 
  UserCheck,
  History
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerStatus } from '../../types';
import { formatBnDate, formatCurrency } from '../../utils/bengali';

interface LineStatusModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LineStatusModal: React.FC<LineStatusModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const { toggleCustomerLineStatus } = useApp();

  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<string>('বকেয়া বিলের জন্য সাময়িক সংযোগ বন্ধ');
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen || !customer) return null;

  const isCurrentlyActive = customer.status === 'active';
  const targetStatus: CustomerStatus = isCurrentlyActive ? 'inactive' : 'active';

  const defaultReasons = [
    'বকেয়া বিলের জন্য সাময়িক সংযোগ বন্ধ',
    'গ্রাহকের ব্যক্তিগত অনুরোধে সাময়িক স্থগিত',
    'বাসা পরিবর্তন বা শিফটিংয়ের কারণে বন্ধ',
    'লাইন বা অপটিক্যাল ফাইবার ত্রুটি',
    'অন্যান্য কারণ',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'অন্যান্য কারণ' && customReason.trim()
      ? customReason.trim()
      : (isCurrentlyActive ? reason : 'গ্রাহকের অনুরোধে সংযোগ পুনরায় সচল করা হয়েছে');

    toggleCustomerLineStatus(
      customer.id,
      targetStatus,
      effectiveDate,
      finalReason
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className={`p-4 text-white relative ${isCurrentlyActive ? 'bg-rose-700' : 'bg-emerald-700'}`}>
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isCurrentlyActive ? 'ইন্টারনেট লাইন সাময়িক বন্ধ' : 'ইন্টারনেট লাইন পুনরায় চালু'}
              </h3>
              <p className="text-white/80 text-xs">
                {customer.name} ({customer.memberId})
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 text-xs text-gray-700 flex-1">
          
          {/* Current Status Pill */}
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-gray-600 font-medium">বর্তমান স্ট্যাটাস:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                isCurrentlyActive
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isCurrentlyActive ? '🟢 চালু (Active)' : '🔴 বন্ধ (Suspended)'}
            </span>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">
              {isCurrentlyActive ? 'লাইন বন্ধের কার্যকর তারিখ *' : 'পুনরায় সংযোগ চালুর তারিখ *'}
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* If Suspending: Reason options */}
          {isCurrentlyActive ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                সংযোগ বন্ধের কারণ নির্বাচন করুন *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {defaultReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {reason === 'অন্যান্য কারণ' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="কারণ বিস্তারিত লিখুন..."
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none mt-1"
                />
              )}

              {/* Warning note */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>গুরুত্বপূর্ণ আর্থিক নিয়ম:</span>
                </p>
                <p className="text-amber-800 text-[10px]">
                  • সংযোগ বন্ধ করলেও গ্রাহকের পূর্ববর্তী কোনো বকেয়া মুছে যাবে না।<br />
                  • লাইন বন্ধ থাকাকালীন নতুন কোনো মাসের বিল যোগ হবে না।<br />
                  • অ্যাডমিন যেকোনো সময় পুনরায় সংযোগ চালু করতে পারবেন।
                </p>
              </div>
            </div>
          ) : (
            /* If Reactivating */
            <div className="space-y-2">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>সংযোগ পুনরায় সচলকরণ:</span>
                </p>
                <p className="text-emerald-800 text-[10px]">
                  • গ্রাহক আবার সক্রিয় তালিকায় যুক্ত হবেন।<br />
                  • নিয়মিত মাসিক বিল: {formatCurrency(customer.monthlyBill)} ({customer.packageName})<br />
                  • চালুকরণের পর থেকে নতুন বিলিং সাইকেলে বিল স্বয়ংক্রিয়ভাবে ধার্য হবে।
                </p>
              </div>
            </div>
          )}

          {/* Past status history log */}
          {customer.statusHistory && customer.statusHistory.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="font-bold text-[11px] text-gray-500 flex items-center space-x-1">
                <History className="w-3 h-3" />
                <span>সংযোগ পরিবর্তনের পূর্ববর্তী ইতিহাস:</span>
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {customer.statusHistory.map((h, i) => (
                  <div key={i} className="text-[10px] bg-gray-50 p-1.5 rounded-lg border border-gray-100 flex justify-between">
                    <div>
                      <strong className={h.status === 'active' ? 'text-emerald-700' : 'text-rose-600'}>
                        {h.status === 'active' ? 'চালু' : 'বন্ধ'}
                      </strong>
                      <span className="text-gray-500 ml-1">({formatBnDate(h.date)})</span>
                      {h.reason && <p className="text-gray-400 mt-0.5">{h.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition active:scale-98 text-xs flex items-center justify-center space-x-1.5 ${
                isCurrentlyActive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {isCurrentlyActive ? 'সংযোগ সাময়িক বন্ধ নিশ্চিত করুন' : 'সংযোগ পুনরায় চালু করুন'}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
