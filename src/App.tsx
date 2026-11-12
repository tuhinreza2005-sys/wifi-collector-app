/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { PinLockModal } from './components/common/PinLockModal';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { CustomerListTab } from './components/customers/CustomerListTab';
import { QuickCollectionTab } from './components/collection/QuickCollectionTab';
import { ReportsTab } from './components/reports/ReportsTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { ReceiptModal } from './components/collection/ReceiptModal';
import { NavigationDrawer } from './components/common/NavigationDrawer';
import { AboutAppModal } from './components/common/AboutAppModal';
import { NewBillingCycleModal } from './components/billing/NewBillingCycleModal';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    activeReceipt, 
    setActiveReceipt,
    isDrawerOpen,
    setIsDrawerOpen,
    isAboutModalOpen,
    setIsAboutModalOpen,
    isNewCycleModalOpen,
    setIsNewCycleModalOpen,
    selectedCustomer,
    setSelectedCustomer
  } = useApp();

  // Configure native Android features (Status Bar & Hardware Back Button)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      StatusBar.setBackgroundColor({ color: '#15803d' }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    } catch (_) {}

    const backListener = CapApp.addListener('backButton', () => {
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
      } else if (isAboutModalOpen) {
        setIsAboutModalOpen(false);
      } else if (isNewCycleModalOpen) {
        setIsNewCycleModalOpen(false);
      } else if (activeReceipt) {
        setActiveReceipt(null);
      } else if (selectedCustomer) {
        setSelectedCustomer(null);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then((handler) => handler.remove()).catch(() => {});
    };
  }, [
    isDrawerOpen,
    isAboutModalOpen,
    isNewCycleModalOpen,
    activeReceipt,
    selectedCustomer,
    activeTab,
    setIsDrawerOpen,
    setIsAboutModalOpen,
    setIsNewCycleModalOpen,
    setActiveReceipt,
    setSelectedCustomer,
    setActiveTab
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none antialiased">
      {/* Navigation Drawer / Sidebar */}
      <NavigationDrawer />

      {/* About App Modal */}
      <AboutAppModal />

      {/* Monthly Billing Cycle Management Modal */}
      <NewBillingCycleModal />

      {/* 4-digit PIN Security Lock Screen */}
      <PinLockModal />

      {/* Mobile Sticky Header */}
      <Header />

      {/* Main View Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-3.5 pt-2">
        {activeTab === 'home' && <DashboardTab />}
        {activeTab === 'customers' && <CustomerListTab />}
        {activeTab === 'collection' && <QuickCollectionTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Global Digital Receipt Modal */}
      <ReceiptModal
        receiptData={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* Android 5-Tab Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
