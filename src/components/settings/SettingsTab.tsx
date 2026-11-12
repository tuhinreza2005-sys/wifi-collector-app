import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Package, 
  Receipt, 
  Database, 
  Cloud, 
  ShieldCheck, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  RotateCcw, 
  Check, 
  RefreshCw,
  History,
  AlertTriangle,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PackageManagerModal } from '../packages/PackageManagerModal';
import { ExpenseModal } from '../expenses/ExpenseModal';
import { ExportService } from '../../services/exportService';
import { StorageService } from '../../services/storage';
import { formatBnDate, toBnNumber } from '../../utils/bengali';

export const SettingsTab: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    syncStatus, 
    triggerSync, 
    auditLogs, 
    bulkAddCustomers, 
    resetToDemoData,
    setIsAboutModalOpen
  } = useApp();

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Form states for company settings
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [collectorName, setCollectorName] = useState(settings.collectorName);
  const [collectorId, setCollectorId] = useState(settings.collectorId);
  const [appPin, setAppPin] = useState(settings.appPin);
  const [isPinLocked, setIsPinLocked] = useState(settings.isPinLocked);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Firebase Config Form
  const [apiKey, setApiKey] = useState(settings.firebaseConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(settings.firebaseConfig?.projectId || '');
  const [appId, setAppId] = useState(settings.firebaseConfig?.appId || '');

  // CSV Bulk Import
  const [csvInput, setCsvInput] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName: companyName.trim(),
      tagline: tagline.trim(),
      phone: phone.trim(),
      address: address.trim(),
      collectorName: collectorName.trim(),
      collectorId: collectorId.trim(),
      appPin: appPin.trim() || '1234',
      isPinLocked,
      firebaseConfig: {
        apiKey: apiKey.trim(),
        projectId: projectId.trim(),
        appId: appId.trim(),
      }
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleBackupDownload = () => {
    const backupJson = StorageService.exportFullBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wificollector_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBackupRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importFullBackup(content);
      if (success) {
        alert('ডাটা ব্যাকআপ সফলভাবে পুনরুদ্ধার করা হয়েছে! পেজ রিলোড হবে।');
        window.location.reload();
      } else {
        alert('ভুল ফাইল ফরম্যাট! সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।');
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = () => {
    if (!csvInput.trim()) {
      setImportStatus('অনুগ্রহ করে CSV ডাটা পেস্ট করুন');
      return;
    }

    const parsed = ExportService.parseCustomerCSV(csvInput);
    if (parsed.length === 0) {
      setImportStatus('কোনো সঠিক গ্রাহকের ডাটা পাওয়া যায়নি। ফরম্যাট পরীক্ষা করুন।');
      return;
    }

    const count = bulkAddCustomers(parsed);
    setImportStatus(`সফলভাবে ${toBnNumber(count)} জন গ্রাহক ইম্পোর্ট করা হয়েছে!`);
    setCsvInput('');
  };

  const handleLoadSampleCSV = () => {
    const sample = `MemberID,Name,Mobile,Package,Bill,Area,Address,Date
WF-201,মোঃ তানভীর আহমেদ,01712998877,২০ এমবিপিএস সুপার,500,মিরপুর-২,বাড়ি # ৪, রোড # ৫,2026-01-01
WF-202,মাহমুদুল হাসান,01819223344,৩০ এমবিপিএস আল্ট্রা,600,মিরপুর-১০,বাড়ি # ১২, রোড # ২,2026-01-01
WF-203,ফারুক হোসেন,01911445566,৪০ এমবিপিএস টার্বো,800,উত্তরা সেক্টর-৩,বাড়ি # ১৮, রোড # ৭,2026-01-01`;
    setCsvInput(sample);
  };

  return (
    <div className="space-y-4 pb-24 pt-1">
      
      {/* Title */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">
          অ্যাপ্লিকেশন সেটিংস ও ডেটা ব্যবস্থাপনা
        </h2>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
          সংস্করণ: ১.০
        </span>
      </div>

      {/* Quick Launch Buttons (প্যাকেজ ও খরচ ব্যবস্থাপনা) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setIsPackageModalOpen(true)}
          className="bg-white hover:bg-emerald-50/50 p-3.5 rounded-2xl border border-gray-100 shadow-xs text-left transition flex items-center space-x-3 active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-gray-900 block leading-tight">
              ইন্টারনেট প্যাকেজ
            </span>
            <span className="text-[10px] text-gray-500">
              স্পিড ও বিল রেট পরিচালনা
            </span>
          </div>
        </button>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="bg-white hover:bg-emerald-50/50 p-3.5 rounded-2xl border border-gray-100 shadow-xs text-left transition flex items-center space-x-3 active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-gray-900 block leading-tight">
              ব্যবসায়িক খরচ
            </span>
            <span className="text-[10px] text-gray-500">
              ব্যান্ডউইথ, ভাড়া ও বেতন
            </span>
          </div>
        </button>
      </div>

      {/* Company Profile & Security Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3.5 text-xs">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-gray-800">কোম্পানি ও রসিদের তথ্য</h3>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl font-semibold flex items-center space-x-1.5 text-xs">
            <Check className="w-4 h-4" />
            <span>সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            কোম্পানি / ISP নাম *
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              স্লোগান / ট্যাগলাইন
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              হটলাইন ফোন নম্বর *
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            অফিসের ঠিকানা
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-gray-800">কালেক্টর ও নিরাপত্তা পিন</h4>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              কালেক্টরের নাম *
            </label>
            <input
              type="text"
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              কালেক্টর আইডি
            </label>
            <input
              type="text"
              value={collectorId}
              onChange={(e) => setCollectorId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              ৪ সংখ্যার অ্যাপ লক পিন *
            </label>
            <input
              type="password"
              maxLength={4}
              value={appPin}
              onChange={(e) => setAppPin(e.target.value)}
              placeholder="1234"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center space-x-2 cursor-pointer mt-3">
              <input
                type="checkbox"
                checked={isPinLocked}
                onChange={(e) => setIsPinLocked(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-gray-800">
                অ্যাপে পিন লক চালু রাখুন
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold py-2.5 rounded-xl shadow-xs transition text-xs"
        >
          সেটিংস সংরক্ষণ করুন
        </button>
      </form>

      {/* Cloud Sync & Firebase Configuration Section */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Cloud className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-gray-800">ক্লাউড সিঙ্ক ও অফলাইন সুরক্ষা</h3>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              syncStatus.isOnline
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {syncStatus.isOnline ? 'অনলাইন যুক্ত' : 'অফলাইন মোড'}
          </span>
        </div>

        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-[11px] text-emerald-950 space-y-1">
          <p className="font-bold flex items-center space-x-1">
            <Database className="w-3.5 h-3.5 text-emerald-700" />
            <span>অফলাইন-ফার্স্ট লোকাল স্টোরেজ সক্রিয়</span>
          </p>
          <p className="text-emerald-800 text-[10px]">
            ইন্টারনেট না থাকলেও গ্রাহক অনুসন্ধান, বিল আদায় ও রসিদ তৈরি নিরবচ্ছিন্নভাবে চলবে। ইন্টারনেট সংযোগ পেলে স্বয়ংক্রিয়ভাবে ক্লাউডের সাথে সমন্বয় হবে।
          </p>
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] text-gray-500">
              সর্বশেষ সিঙ্ক: {formatBnDate(syncStatus.lastSyncedAt || '', true)}
            </span>
            <button
              onClick={() => triggerSync()}
              disabled={syncStatus.isSyncing}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center space-x-1 hover:bg-emerald-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncStatus.isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিঙ্ক করুন'}</span>
            </button>
          </div>
        </div>

        {/* Optional Firebase Custom Credentials */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-700 text-[11px]">
              ফায়ারবেস ক্লাউড ডাটাবেস ক্রেডেনশিয়াল (ঐচ্ছিক)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Firebase Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-wifi-billing-app"
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Web API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Customer Import from CSV/Excel */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-gray-800">একসাথে একাধিক গ্রাহক ইম্পোর্ট (Excel/CSV)</h3>
          </div>
          <button
            onClick={handleLoadSampleCSV}
            className="text-[10px] font-semibold text-emerald-700 hover:underline"
          >
            নমুনা ফরম্যাট লোড করুন
          </button>
        </div>

        <p className="text-[11px] text-gray-500">
          এক্সেল থেকে কপি করে নিচের বক্সে পেস্ট করুন: MemberID, Name, Mobile, Package, Bill, Area, Address
        </p>

        <textarea
          value={csvInput}
          onChange={(e) => setCsvInput(e.target.value)}
          placeholder="MemberID,Name,Mobile,Package,Bill,Area,Address,Date
WF-101,মোঃ তানভীর,01711223344,২০ এমবিপিএস,500,মিরপুর,বাড়ি # ১,2026-01-01"
          rows={4}
          className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-mono text-[10px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />

        {importStatus && (
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
            {importStatus}
          </div>
        )}

        <button
          onClick={handleBulkImport}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition active:scale-98"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>গ্রাহক ডাটা ইম্পোর্ট করুন</span>
        </button>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 text-xs">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
          <Database className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-gray-800">সম্পূর্ণ ব্যাকআপ ও পুনরুদ্ধার (Local Backup)</h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleBackupDownload}
            className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>JSON ব্যাকআপ ডাউনলোড</span>
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition active:scale-98 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>ফাইল থেকে রিস্টোর</span>
            <input
              type="file"
              accept=".json"
              onChange={handleBackupRestore}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* System Audit Logs Section */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2 text-xs">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowAuditLogs(!showAuditLogs)}
        >
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-gray-800">
              সিস্টেম অডিট ট্রেইল ({toBnNumber(auditLogs.length)} টি রেকর্ড)
            </h3>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">
            {showAuditLogs ? 'লুকান' : 'দেখুন'}
          </span>
        </div>

        {showAuditLogs && (
          <div className="mt-2 divide-y divide-gray-100 max-h-56 overflow-y-auto pt-1">
            {auditLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="py-2 text-[11px] space-y-0.5">
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>{log.action}</span>
                  <span className="text-gray-400 font-normal text-[10px]">
                    {formatBnDate(log.timestamp, true)}
                  </span>
                </div>
                <div className="text-gray-600 text-[10px]">{log.details}</div>
                <div className="text-gray-400 text-[9px]">সম্পাদনকারী: {log.performedBy}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Developer & About App Card */}
      <div 
        onClick={() => setIsAboutModalOpen(true)}
        className="bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/90 rounded-2xl p-3.5 shadow-xs transition cursor-pointer select-none"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 tracking-tight uppercase">
              Developed by
            </span>
            <h4 className="text-xs font-bold text-gray-900 leading-tight">
              Md. Tuhin Reza
            </h4>
            <p className="text-[10px] text-gray-600 mt-0.5">
              Diploma in Electrical Engineering
            </p>
            <p className="text-[9.5px] text-gray-500">
              Chapainawabganj Polytechnic Institute
            </p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-700 text-white font-bold rounded-xl text-[10px] shadow-xs flex items-center space-x-1">
            <span>অ্যাপ পরিচিতি</span>
            <span>&rarr;</span>
          </span>
        </div>
      </div>

      {/* Reset to Demo Data button */}
      <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center space-y-1.5">
        <p className="text-xs font-bold text-rose-800">ডেমো ডাটা রিসেট করতে চান?</p>
        <p className="text-[10px] text-rose-600">
          এটি সকল বর্তমান তথ্য মুছে দিয়ে ৫০+ নতুন বাংলাদেশি গ্রাহক এবং পূর্বের বিলিং ডাটা নতুন করে লোড করবে।
        </p>
        <button
          onClick={() => {
            if (confirm('আপনি কি নিশ্চিত যে ডেমো ডাটা রিসেট করতে চান?')) {
              resetToDemoData();
              alert('ডেমো ডাটা সফলভাবে রিসেট করা হয়েছে!');
            }
          }}
          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-xs"
        >
          ডেমো ডাটা রিসেট করুন
        </button>
      </div>

      {/* Package Manager Modal */}
      <PackageManagerModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
      />

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

    </div>
  );
};
