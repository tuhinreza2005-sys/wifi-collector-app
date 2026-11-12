import React from 'react';
import { 
  X, 
  Home, 
  Users, 
  CreditCard, 
  BarChart3, 
  Clock, 
  Package, 
  Receipt, 
  Settings, 
  Info, 
  Wifi, 
  Code2, 
  GraduationCap, 
  Building2, 
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';

export const NavigationDrawer: React.FC = () => {
  const { 
    isDrawerOpen, 
    setIsDrawerOpen, 
    activeTab, 
    setActiveTab, 
    setIsAboutModalOpen, 
    settings,
    syncStatus,
    triggerSync,
    setIsNewCycleModalOpen
  } = useApp();

  if (!isDrawerOpen) return null;

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
  };

  const handleOpenAbout = () => {
    setIsDrawerOpen(false);
    setIsAboutModalOpen(true);
  };

  const navMenuItems = [
    { tab: 'home' as ActiveTab, label: 'হোম ড্যাশবোর্ড', icon: <Home className="w-4 h-4" /> },
    { tab: 'customers' as ActiveTab, label: 'গ্রাহক ব্যবস্থাপনা', icon: <Users className="w-4 h-4" /> },
    { tab: 'collection' as ActiveTab, label: 'দ্রুত কালেকশন মোড', icon: <CreditCard className="w-4 h-4" />, highlight: true },
    { tab: 'reports' as ActiveTab, label: 'আর্থিক রিপোর্ট ও বকেয়া', icon: <BarChart3 className="w-4 h-4" /> },
    { tab: 'settings' as ActiveTab, label: 'অ্যাপ্লিকেশন সেটিংস', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Drawer Surface */}
      <div className="relative w-4/5 max-w-[310px] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4 relative">
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="absolute right-3 top-3 p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
            aria-label="ড্রয়ার বন্ধ করুন"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-emerald-200 shadow-inner">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">WiFi Collector</h2>
              <span className="text-[10px] text-emerald-200 block">Smart Billing Manager</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/15 text-xs">
            <div className="font-semibold text-white truncate">{settings.companyName}</div>
            <div className="text-[11px] text-emerald-100 flex items-center justify-between mt-0.5">
              <span>কালেক্টর: {settings.collectorName}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${syncStatus.isOnline ? 'bg-emerald-500/40 text-emerald-100' : 'bg-amber-500/40 text-amber-100'}`}>
                {syncStatus.isOnline ? 'অনলাইন' : 'অফলাইন'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-1 text-xs">
          <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            প্রধান মেনু
          </div>

          {navMenuItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => handleNavClick(item.tab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition active:scale-98 text-left ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-xs'
                    : item.highlight
                    ? 'bg-emerald-600/10 text-emerald-800 font-semibold hover:bg-emerald-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={isActive || item.highlight ? 'text-emerald-700' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            );
          })}

          <div className="pt-2 px-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            বিলিং ও সাইকেল
          </div>

          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setIsNewCycleModalOpen(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold transition text-left"
          >
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>নতুন মাস শুরু করুন</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
          </button>

          <div className="pt-2 px-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            সহায়ক অপশন
          </div>

          <button
            onClick={() => {
              setIsDrawerOpen(false);
              triggerSync();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition text-left"
          >
            <div className="flex items-center space-x-2.5">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${syncStatus.isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>ক্লাউড সিঙ্ক করুন</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">
              {syncStatus.isSyncing ? 'চলছে...' : 'সিঙ্ক'}
            </span>
          </button>

          <button
            onClick={handleOpenAbout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition text-left"
          >
            <div className="flex items-center space-x-2.5">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>অ্যাপ সম্পর্কে (About App)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Developer Name Display at the bottom of the sidebar */}
        <div 
          onClick={handleOpenAbout}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleOpenAbout();
            }
          }}
          className="p-3 bg-emerald-50/80 hover:bg-emerald-100/80 border-t border-emerald-100/90 cursor-pointer transition select-none group active:bg-emerald-200/70"
          title="ডেভেলপার সম্পর্কে জানতে ক্লিক করুন"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/15 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 pr-1">
                <span className="text-[10px] font-semibold text-emerald-700 block tracking-tight leading-none mb-0.5">
                  Developed by
                </span>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-900 leading-tight">
                  Md. Tuhin Reza
                </h4>
                <p className="text-[10px] text-gray-600 leading-tight mt-0.5">
                  Diploma in Electrical Engineering
                </p>
                <p className="text-[9.5px] text-gray-500 leading-tight">
                  Chapainawabganj Polytechnic Institute
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-emerald-600/60 group-hover:text-emerald-800 shrink-0 self-center group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </div>
    </div>
  );
};
