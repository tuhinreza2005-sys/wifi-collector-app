import React from 'react';
import { Wifi, WifiOff, RefreshCw, Lock, Calendar, Menu, PlusCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatYearMonth } from '../../utils/bengali';

export const Header: React.FC = () => {
  const { 
    settings, 
    syncStatus, 
    triggerSync, 
    lockApp, 
    selectedMonth, 
    setSelectedMonth,
    setIsDrawerOpen,
    setIsNewCycleModalOpen
  } = useApp();

  const availableMonths = [
    '2026-09',
    '2026-10',
    '2026-11',
    '2026-12',
    '2027-01'
  ];

  return (
    <header className="sticky top-0 z-30 bg-emerald-700 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-md mx-auto px-3.5 py-2.5 flex items-center justify-between">
        
        {/* Menu Drawer Button & Company Title */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-white"
            aria-label="মেনু সাইডবার খুলুন"
            title="মেনু"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-sm font-bold tracking-tight leading-tight line-clamp-1">
              {settings.companyName}
            </h1>
            <div className="flex items-center space-x-2 text-xs text-emerald-100">
              <span className="flex items-center space-x-1">
                {syncStatus.isOnline ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mr-1 animate-pulse"></span>
                    অনলাইন
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/30 text-amber-200 border border-amber-400/30">
                    <WifiOff className="w-3 h-3 mr-1" />
                    অফলাইন মোড
                  </span>
                )}
              </span>
              <span>•</span>
              <span className="text-[11px] opacity-90">{settings.collectorName}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Month Selector Pill */}
          <div className="relative">
            <label className="flex items-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-2 py-1 text-xs cursor-pointer transition">
              <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-200" />
              <span className="font-medium text-xs text-white">
                {formatYearMonth(selectedMonth)}
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="বিলের মাস নির্বাচন করুন"
              >
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym} className="text-gray-900 bg-white">
                    {formatYearMonth(ym)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Start New Month Button */}
          <button
            onClick={() => setIsNewCycleModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition text-white flex items-center space-x-1 border border-emerald-400/30 text-xs shadow-xs"
            title="নতুন মাস শুরু করুন"
            aria-label="নতুন মাস শুরু করুন"
          >
            <PlusCircle className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline font-bold text-[11px]">নতুন মাস</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={() => triggerSync()}
            disabled={syncStatus.isSyncing}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition text-white"
            title="ক্লাউড সিঙ্ক করুন"
            aria-label="সিঙ্ক করুন"
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin text-emerald-300' : ''}`} />
          </button>

          {/* Lock App */}
          <button
            onClick={lockApp}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition text-white"
            title="অ্যাপ লক করুন"
            aria-label="লক করুন"
          >
            <Lock className="w-4 h-4 text-emerald-100" />
          </button>
        </div>

      </div>
    </header>
  );
};
