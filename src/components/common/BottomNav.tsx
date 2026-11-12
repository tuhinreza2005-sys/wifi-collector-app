import React from 'react';
import { Home, Users, CreditCard, BarChart3, Settings } from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, transactions } = useApp();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTransactionsCount = transactions.filter((t) => !t.isReversed && t.timestamp.startsWith(todayStr)).length;

  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode; isAction?: boolean }[] = [
    {
      tab: 'home',
      label: 'হোম',
      icon: <Home className="w-5 h-5" />,
    },
    {
      tab: 'customers',
      label: 'গ্রাহক',
      icon: <Users className="w-5 h-5" />,
    },
    {
      tab: 'collection',
      label: 'কালেকশন',
      icon: <CreditCard className="w-6 h-6" />,
      isAction: true,
    },
    {
      tab: 'reports',
      label: 'রিপোর্ট',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      tab: 'settings',
      label: 'সেটিংস',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;

          if (item.isAction) {
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className="relative -top-4 flex flex-col items-center justify-center group focus:outline-none"
                aria-label={item.label}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-105'
                      : 'bg-emerald-700 text-white hover:bg-emerald-600'
                  }`}
                >
                  {item.icon}
                </div>
                <span className={`text-[11px] font-bold mt-1 ${isActive ? 'text-emerald-700' : 'text-gray-600'}`}>
                  {item.label}
                </span>
                {todayTransactionsCount > 0 && (
                  <span className="absolute top-0 right-3 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {todayTransactionsCount > 9 ? '9+' : todayTransactionsCount}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive ? 'text-emerald-700 font-bold' : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                )}
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'font-bold text-emerald-800' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
