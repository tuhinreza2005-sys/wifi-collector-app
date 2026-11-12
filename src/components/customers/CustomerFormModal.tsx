import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Package, Calendar, DollarSign, Camera, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerStatus } from '../../types';
import { toBnNumber } from '../../utils/bengali';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
}) => {
  const { packages, addCustomer, updateCustomer, customers } = useApp();

  const [name, setName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('মিরপুর-১০');
  const [packageId, setPackageId] = useState('');
  const [monthlyBill, setMonthlyBill] = useState<number>(500);
  const [connectionDate, setConnectionDate] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('active');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setMemberId(customerToEdit.memberId);
      setMobile(customerToEdit.mobile);
      setAlternateMobile(customerToEdit.alternateMobile || '');
      setAddress(customerToEdit.address);
      setArea(customerToEdit.area);
      setPackageId(customerToEdit.packageId);
      setMonthlyBill(customerToEdit.monthlyBill);
      setConnectionDate(customerToEdit.connectionDate);
      setStatus(customerToEdit.status);
      setNotes(customerToEdit.notes || '');
      setLatitude(customerToEdit.latitude ? String(customerToEdit.latitude) : '');
      setLongitude(customerToEdit.longitude ? String(customerToEdit.longitude) : '');
    } else {
      // Auto-generate new ID
      const nextId = `WF-${customers.length + 101}`;
      setName('');
      setMemberId(nextId);
      setMobile('');
      setAlternateMobile('');
      setAddress('');
      setArea('মিরপুর-১০');
      const defaultPkg = packages[1] || packages[0];
      setPackageId(defaultPkg?.id || 'pkg-2');
      setMonthlyBill(defaultPkg?.monthlyFee || 500);
      setConnectionDate(new Date().toISOString().slice(0, 10));
      setStatus('active');
      setNotes('');
      setLatitude('');
      setLongitude('');
    }
    setErrorMsg('');
  }, [customerToEdit, isOpen, customers.length, packages]);

  if (!isOpen) return null;

  const handlePackageChange = (selectedPkgId: string) => {
    setPackageId(selectedPkgId);
    const found = packages.find((p) => p.id === selectedPkgId);
    if (found) {
      setMonthlyBill(found.monthlyFee);
    }
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
        },
        () => {
          setErrorMsg('লোকেশন পেতে ব্যর্থ হয়েছে। ব্রাউজারে জিপিএস পারমিশন দিন।');
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('গ্রাহকের নাম আবশ্যক');
      return;
    }
    if (!mobile.trim() || mobile.length < 11) {
      setErrorMsg('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)');
      return;
    }

    const selectedPkg = packages.find((p) => p.id === packageId);
    const packageName = selectedPkg ? selectedPkg.name : 'কাস্টম প্যাকেজ';

    if (customerToEdit) {
      const isStatusChanged = customerToEdit.status !== status;
      const todayDate = new Date().toISOString().slice(0, 10);
      updateCustomer({
        ...customerToEdit,
        name: name.trim(),
        memberId: memberId.trim(),
        mobile: mobile.trim(),
        alternateMobile: alternateMobile.trim() || undefined,
        address: address.trim(),
        area: area.trim(),
        packageId,
        packageName,
        monthlyBill: Number(monthlyBill),
        connectionDate,
        status,
        suspensionDate: status === 'inactive' ? (customerToEdit.suspensionDate || todayDate) : undefined,
        suspensionReason: status === 'inactive' ? (customerToEdit.suspensionReason || 'গ্রাহকের অনুরোধে লাইন সাময়িক বন্ধ') : undefined,
        reactivationDate: status === 'active' && isStatusChanged ? todayDate : customerToEdit.reactivationDate,
        notes: notes.trim() || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });
    } else {
      addCustomer({
        name: name.trim(),
        memberId: memberId.trim(),
        mobile: mobile.trim(),
        alternateMobile: alternateMobile.trim() || undefined,
        address: address.trim(),
        area: area.trim(),
        packageId,
        packageName,
        monthlyBill: Number(monthlyBill),
        connectionDate,
        status,
        notes: notes.trim() || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
        
        {/* Header */}
        <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <h3 className="font-bold text-base">
              {customerToEdit ? 'গ্রাহকের তথ্য পরিবর্তন' : 'নতুন গ্রাহক নিবন্ধন'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3.5 text-xs text-gray-700 flex-1">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Member ID & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                মেম্বার আইডি (ইউনিক) *
              </label>
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                সংযোগ স্ট্যাটাস *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="active">সক্রিয় (Active)</option>
                <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
              </select>
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              গ্রাহকের পূর্ণ নাম *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                required
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Mobile Numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                প্রধান মোবাইল নম্বর *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="017xxxxxxxx"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                বিকল্প মোবাইল (ঐচ্ছিক)
              </label>
              <input
                type="tel"
                value={alternateMobile}
                onChange={(e) => setAlternateMobile(e.target.value)}
                placeholder="018xxxxxxxx"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Area & Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                এলাকা / সেক্টর *
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="যেমন: মিরপুর-১০"
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                সংযোগ তারিখ *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={connectionDate}
                  onChange={(e) => setConnectionDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              বিস্তারিত ঠিকানা (বাড়ি/রোড/ফ্ল্যাট) *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="বাড়ি # ১২, রোড # ৩, ব্লক-সি"
                required
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Internet Package & Monthly Bill */}
          <div className="grid grid-cols-2 gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
            <div>
              <label className="block font-semibold text-emerald-900 mb-1">
                ইন্টারনেট প্যাকেজ *
              </label>
              <select
                value={packageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full bg-white border border-emerald-200 rounded-xl px-2.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.speed})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-emerald-900 mb-1">
                মাসিক বিল (টাকা) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-emerald-700 font-bold">৳</span>
                <input
                  type="number"
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(Number(e.target.value))}
                  required
                  min="0"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location & GPS Info (optional) */}
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="font-semibold text-gray-700 block">জিপিএস লোকেশন (ঐচ্ছিক)</span>
              <span className="text-[10px] text-gray-500">
                {latitude ? `${latitude}, ${longitude}` : 'লোকেশন সংরক্ষিত নেই'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 text-xs flex items-center space-x-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>লোকেশন নিন</span>
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              বিশেষ মন্তব্য / রাউটার পাসওয়ার্ড
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="রাউটার মডেল, বক্স পোর্ট নম্বর ইত্যাদি"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm"
            >
              <Check className="w-4 h-4" />
              <span>{customerToEdit ? 'তথ্য আপডেট করুন' : 'গ্রাহক সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
