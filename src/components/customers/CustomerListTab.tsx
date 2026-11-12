import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Wifi,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { BillingService } from '../../services/billing';
import { ExportService } from '../../services/exportService';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { 
  formatCurrency, 
  toBnNumber, 
  normalizeSearch, 
  formatYearMonth 
} from '../../utils/bengali';

export const CustomerListTab: React.FC = () => {
  const { customers, billings, selectedMonth, setSelectedCustomer, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid' | 'active' | 'inactive'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  // Extract unique areas
  const areas = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.area) set.add(c.area);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = normalizeSearch(searchQuery);

    return customers.filter((cust) => {
      // Area match
      if (selectedArea !== 'all' && cust.area !== selectedArea) {
        return false;
      }

      // Status match
      const billRecord = BillingService.getOrCreateMonthBilling(cust, selectedMonth, billings);
      if (statusFilter === 'due' && billRecord.dueAmount <= 0) return false;
      if (statusFilter === 'paid' && billRecord.status !== 'paid') return false;
      if (statusFilter === 'active' && cust.status !== 'active') return false;
      if (statusFilter === 'inactive' && cust.status !== 'inactive') return false;

      // Query match
      if (!q) return true;
      const matchName = normalizeSearch(cust.name).includes(q);
      const matchMobile = normalizeSearch(cust.mobile).includes(q);
      const matchAltMobile = cust.alternateMobile ? normalizeSearch(cust.alternateMobile).includes(q) : false;
      const matchId = normalizeSearch(cust.memberId).includes(q);
      const matchArea = normalizeSearch(cust.area).includes(q);

      return matchName || matchMobile || matchAltMobile || matchId || matchArea;
    });
  }, [customers, searchQuery, selectedArea, statusFilter, selectedMonth, billings]);

  const handleExportExcel = () => {
    ExportService.exportCustomersToExcel(customers);
  };

  const handleQuickCollect = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setActiveTab('collection');
  };

  return (
    <div className="space-y-3 pb-24 pt-1">
      
      {/* Top Search & Actions Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2.5">
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মোবাইল, আইডি বা নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Add Customer Button */}
          <button
            onClick={() => {
              setCustomerToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 shadow-sm transition"
            title="নতুন গ্রাহক যুক্ত করুন"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">নতুন গ্রাহক</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            সব ({toBnNumber(customers.length)})
          </button>

          <button
            onClick={() => setStatusFilter('due')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
              statusFilter === 'due'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            বকেয়া আছে
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            🟢 চালু
          </button>

          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
              statusFilter === 'inactive'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            🔴 লাইন বন্ধ
          </button>

          {/* Area Dropdown */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-gray-100 border-none text-gray-700 text-xs rounded-full px-2.5 py-1 font-medium focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">সব এলাকা</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="p-1 rounded-full text-emerald-700 hover:bg-emerald-50 active:scale-95 transition ml-auto"
            title="এক্সেল ডাউনলোড করুন"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Count Info */}
      <div className="flex items-center justify-between px-1 text-xs text-gray-500">
        <span>
          পাওয়া গেছে: <strong className="text-gray-900">{toBnNumber(filteredCustomers.length)}</strong> জন গ্রাহক
        </span>
        <span className="text-[11px] text-emerald-700 font-medium">
          বিলের মাস: {formatYearMonth(selectedMonth)}
        </span>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm text-gray-400">
          <Wifi className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-xs font-semibold">কোনো গ্রাহক পাওয়া যায়নি</p>
          <p className="text-[11px] mt-1">অন্য কোনো নাম, মোবাইল বা আইডি দিয়ে অনুসন্ধান করুন</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer) => {
            const billRecord = BillingService.getOrCreateMonthBilling(customer, selectedMonth, billings);

            return (
              <div
                key={customer.id}
                onClick={() => setViewCustomer(customer)}
                className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-200 transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  {/* Avatar & Info */}
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                      {customer.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">
                          {customer.name}
                        </h4>
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                          {customer.memberId}
                        </span>
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${customer.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {customer.status === 'active' ? '🟢 চালু' : '🔴 বন্ধ'}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 mt-0.5 flex items-center space-x-2">
                        <span>{customer.mobile}</span>
                        <span>•</span>
                        <span>{customer.packageName}</span>
                      </div>

                      <div className="text-[11px] text-gray-400 flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-0.5 text-gray-400" />
                        {customer.area}
                      </div>
                    </div>
                  </div>

                  {/* Status & Due Column */}
                  <div className="text-right shrink-0">
                    {billRecord.status === 'paid' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        পরিশোধিত
                      </span>
                    ) : billRecord.status === 'partial' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        আংশিক ({formatCurrency(billRecord.dueAmount)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        বকেয়া {formatCurrency(billRecord.dueAmount)}
                      </span>
                    )}

                    <div className="text-[11px] text-gray-500 mt-1">
                      বিল: {formatCurrency(billRecord.netBill)}
                    </div>
                  </div>
                </div>

                {/* Quick Action Footer inside Card */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <a
                      href={`tel:${customer.mobile}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 flex items-center space-x-1 transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>কল</span>
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    {billRecord.dueAmount > 0 && (
                      <button
                        onClick={(e) => handleQuickCollect(e, customer)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>বিল আদায়</span>
                      </button>
                    )}
                    <span className="text-gray-400">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
      />

      {/* Customer Profile & Billing Calendar Modal */}
      <CustomerDetailModal
        customer={viewCustomer}
        onClose={() => setViewCustomer(null)}
        onEdit={(cust) => {
          setViewCustomer(null);
          setCustomerToEdit(cust);
          setIsAddModalOpen(true);
        }}
      />

    </div>
  );
};
