import React, { useState } from 'react';
import { X, Plus, Package as PackageIcon, Trash2, Edit2, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InternetPackage } from '../../types';
import { formatCurrency, toBnNumber } from '../../utils/bengali';

interface PackageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PackageManagerModal: React.FC<PackageManagerModalProps> = ({ isOpen, onClose }) => {
  const { packages, addPackage, updatePackage, deletePackage, customers } = useApp();

  const [name, setName] = useState('');
  const [speed, setSpeed] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !speed.trim() || !monthlyFee) return;

    if (editingId) {
      updatePackage({
        id: editingId,
        name: name.trim(),
        speed: speed.trim(),
        monthlyFee: Number(monthlyFee),
        description: description.trim() || undefined,
      });
      setEditingId(null);
    } else {
      addPackage({
        name: name.trim(),
        speed: speed.trim(),
        monthlyFee: Number(monthlyFee),
        description: description.trim() || undefined,
      });
    }

    setName('');
    setSpeed('');
    setMonthlyFee('');
    setDescription('');
  };

  const handleStartEdit = (pkg: InternetPackage) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setSpeed(pkg.speed);
    setMonthlyFee(String(pkg.monthlyFee));
    setDescription(pkg.description || '');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PackageIcon className="w-5 h-5" />
            <h3 className="font-bold text-base">ইন্টারনেট প্যাকেজ ব্যবস্থাপনা</h3>
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
          {/* Add / Edit Form */}
          <form onSubmit={handleSubmit} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
            <span className="font-bold text-xs text-gray-800 block">
              {editingId ? 'প্যাকেজ সম্পাদনা করুন' : 'নতুন প্যাকেজ যোগ করুন'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  প্যাকেজের নাম *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: ২০ এমবিপিএস সুপার"
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  স্পিড ব্যান্ডউইথ *
                </label>
                <input
                  type="text"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  placeholder="যেমন: 20 Mbps"
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  মাসিক বিল (টাকা) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 font-bold">৳</span>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    placeholder="500"
                    min="1"
                    required
                    className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  বিবরণ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ইউটিউব ও এইচডি ব্রাউজিং"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setSpeed('');
                    setMonthlyFee('');
                    setDescription('');
                  }}
                  className="px-3 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold text-xs"
                >
                  বাতিল
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition active:scale-98 shadow-sm"
              >
                {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingId ? 'আপডেট করুন' : 'প্যাকেজ সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </form>

          {/* Current Packages List */}
          <div className="space-y-2">
            <span className="font-bold text-xs text-gray-800 block">
              বিদ্যমান ইন্টারনেট প্যাকেজ ({toBnNumber(packages.length)} টি)
            </span>

            {packages.map((pkg) => {
              const activeUsersCount = customers.filter((c) => c.packageId === pkg.id).length;

              return (
                <div
                  key={pkg.id}
                  className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <h5 className="font-bold text-xs text-gray-900">{pkg.name}</h5>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded text-[10px]">
                        {pkg.speed}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {pkg.description || 'নিয়মিত ইন্টারনেট'} • ব্যবহারকারী: {toBnNumber(activeUsersCount)} জন
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-700">
                      {formatCurrency(pkg.monthlyFee)}
                    </span>
                    <button
                      onClick={() => handleStartEdit(pkg)}
                      className="p-1 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="সম্পাদনা"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {packages.length > 1 && (
                      <button
                        onClick={() => deletePackage(pkg.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
