import React, { useState } from 'react';
import { X, Plus, Trash2, Receipt, DollarSign, Calendar, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory } from '../../types';
import { formatCurrency, formatBnDate, getExpenseCategoryLabel, toBnNumber, formatYearMonth } from '../../utils/bengali';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  const { expenses, addExpense, deleteExpense, selectedMonth, settings } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('bandwidth');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentMonthExpenses = expenses.filter((e) => e.month === selectedMonth);
  const totalExpense = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    addExpense({
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      month: date.slice(0, 7),
      recordedBy: settings.collectorName,
      receiptNumber: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setAmount('');
    setReceiptNumber('');
    setNotes('');
  };

  const categories: { id: ExpenseCategory; label: string }[] = [
    { id: 'bandwidth', label: 'ব্যান্ডউইথ খরচ' },
    { id: 'rent', label: 'অফিস ভাড়া' },
    { id: 'salary', label: 'কর্মচারী বেতন' },
    { id: 'equipment', label: 'সরঞ্জাম ও ক্যাবল' },
    { id: 'maintenance', label: 'রক্ষণাবেক্ষণ' },
    { id: 'electricity', label: 'বিদ্যুৎ বিল' },
    { id: 'other', label: 'অন্যান্য খরচ' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">ব্যবসায়িক ব্যয় ব্যবস্থাপনা (Expenses)</h3>
            <p className="text-emerald-200 text-xs">
              {formatYearMonth(selectedMonth)} এর মোট খরচ: {formatCurrency(totalExpense)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 text-xs">
          {/* Add New Expense Form */}
          <form onSubmit={handleSubmit} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
            <span className="font-bold text-xs text-gray-800 block">
              নতুন খরচ এন্ট্রি করুন
            </span>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                খরচের বিবরণ *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: অপটিক্যাল ফাইবার ক্যাবল কেনা"
                required
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  টাকার পরিমাণ *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 font-bold">৳</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                    required
                    className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  ক্যাটাগরি *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  তারিখ *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  ভাউচার / রসিদ নং
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="OPT-491"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition active:scale-98 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>খরচ যোগ করুন</span>
            </button>
          </form>

          {/* Expenses List */}
          <div className="space-y-2">
            <span className="font-bold text-xs text-gray-800 block">
              {formatYearMonth(selectedMonth)} এর খরচের তালিকা ({toBnNumber(currentMonthExpenses.length)} টি)
            </span>

            {currentMonthExpenses.length === 0 ? (
              <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-2xl">
                এই মাসে এখনও কোনো খরচের হিসাব রেকর্ড করা হয়নি।
              </div>
            ) : (
              currentMonthExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-bold text-xs text-gray-900">{exp.title}</h5>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {getExpenseCategoryLabel(exp.category)} • {formatBnDate(exp.date)}
                      {exp.receiptNumber && ` • ভাউচার: ${exp.receiptNumber}`}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-rose-600">
                      -{formatCurrency(exp.amount)}
                    </span>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
