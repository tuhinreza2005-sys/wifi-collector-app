import React from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  MessageSquare, 
  CheckCircle2, 
  Download, 
  Wifi,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Transaction } from '../../types';
import { ExportService } from '../../services/exportService';
import { 
  formatCurrency, 
  toBnNumber, 
  formatYearMonth, 
  formatBnDate, 
  getPaymentMethodLabel 
} from '../../utils/bengali';

interface ReceiptModalProps {
  receiptData: {
    transaction: Transaction;
    currentDue: number;
    billingMonth: string;
  } | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receiptData, onClose }) => {
  const { settings } = useApp();

  if (!receiptData) return null;

  const { transaction, currentDue, billingMonth } = receiptData;

  const handlePrint = () => {
    ExportService.printReceipt({
      transaction,
      settings,
      currentDue,
      billingMonth,
    });
  };

  const smsText = `ধন্যবাদ! ${settings.companyName}: রসিদ নং ${transaction.receiptNo}, ${formatYearMonth(billingMonth)} এর বিল আদায় ৳${transaction.totalAmount} (${getPaymentMethodLabel(transaction.paymentMethod)}), অবশিষ্ট বকেয়া ৳${currentDue}। যোগাযোগ: ${settings.phone}`;

  const handleCopySMS = () => {
    navigator.clipboard.writeText(smsText);
    alert('রসিদের এসএমএস টেক্সট কপি করা হয়েছে!');
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(smsText);
    const url = `https://wa.me/88${transaction.customerMobile}?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95">
        
        {/* Receipt Header Badge */}
        <div className="bg-emerald-700 text-white p-4 relative text-center">
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/20">
            <CheckCircle2 className="w-7 h-7 text-emerald-300" />
          </div>
          <h3 className="font-bold text-base">কালেকশন সফল হয়েছে!</h3>
          <p className="text-emerald-100 text-xs">ডিজিটাল মানি রসিদ তৈরি সম্পন্ন</p>
        </div>

        {/* Printable Voucher Card */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1 bg-gray-50/50">
          <div className="bg-white p-3.5 rounded-2xl border border-dashed border-gray-300 shadow-xs space-y-2.5">
            {/* Company Info */}
            <div className="text-center pb-2 border-b border-gray-100">
              <h4 className="font-bold text-sm text-emerald-800 leading-tight">
                {settings.companyName}
              </h4>
              <p className="text-[10px] text-gray-500">{settings.tagline}</p>
              <p className="text-[10px] text-gray-500">ফোন: {settings.phone}</p>
              <span className="inline-block px-2 py-0.5 mt-1 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200">
                ইন্টারনেট বিল পেমেন্ট রসিদ
              </span>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div>
                <span className="text-gray-400 block">রসিদ নং:</span>
                <span className="font-bold text-gray-800">{transaction.receiptNo}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">তারিখ ও সময়:</span>
                <span className="font-semibold text-gray-800">{formatBnDate(transaction.timestamp, true)}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-gray-50 p-2 rounded-xl text-[11px] space-y-1 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">গ্রাহকের নাম:</span>
                <span className="font-bold text-gray-900">{transaction.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">মেম্বার আইডি:</span>
                <span className="font-semibold text-gray-800">{transaction.customerMemberId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">মোবাইল:</span>
                <span className="font-semibold text-gray-800">{transaction.customerMobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">এলাকা:</span>
                <span className="font-semibold text-gray-800">{transaction.customerArea}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">বিলের মাস:</span>
                <span className="font-bold text-emerald-800">{formatYearMonth(billingMonth)}</span>
              </div>
            </div>

            {/* Amount Highlight */}
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-center space-y-1">
              <span className="text-emerald-800 text-[11px] font-semibold block">আদায়কৃত টাকার পরিমাণ</span>
              <div className="text-2xl font-black text-emerald-700">
                {formatCurrency(transaction.totalAmount)}
              </div>
              <div className="text-[11px] font-medium text-emerald-800">
                পেমেন্ট মাধ্যম: {getPaymentMethodLabel(transaction.paymentMethod)}
              </div>
            </div>

            {/* Remaining Due & Collector */}
            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between">
                <span className="text-gray-500">অবশিষ্ট বকেয়া পাওনা:</span>
                <span className={`font-bold ${currentDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatCurrency(currentDue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">বিল সংগ্রহকারী:</span>
                <span className="font-semibold text-gray-700">{transaction.collectedBy}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>ট্র্যাকিং আইডি:</span>
                <span className="font-mono">{transaction.id}</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[10px] text-gray-400 border-t border-gray-100">
              আমাদের সাথে থাকার জন্য ধন্যবাদ!
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-white border-t border-gray-100 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF ভাউচার</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-1.5 border border-emerald-200 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপ রসিদ</span>
            </button>
          </div>

          <button
            onClick={handleCopySMS}
            className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs flex items-center justify-center space-x-1.5 transition active:scale-98"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>এসএমএস টেক্সট কপি করুন</span>
          </button>
        </div>

      </div>
    </div>
  );
};
