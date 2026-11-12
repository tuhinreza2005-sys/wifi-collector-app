import React from 'react';
import { 
  X, 
  Wifi, 
  Code2, 
  GraduationCap, 
  Building2, 
  Mail, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AboutAppModal: React.FC = () => {
  const { isAboutModalOpen, setIsAboutModalOpen, settings } = useApp();

  if (!isAboutModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4 relative text-center">
          <button
            onClick={() => setIsAboutModalOpen(false)}
            className="absolute right-3.5 top-3.5 p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-2 text-emerald-200 shadow-inner">
            <Wifi className="w-7 h-7" />
          </div>

          <h3 className="font-bold text-base leading-tight">
            WiFi Collector
          </h3>
          <p className="text-[11px] text-emerald-100 mt-0.5">
            Smart Billing & Collection Manager
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-emerald-50 border border-white/20">
            ভার্সন ১.০ (অ্যান্ড্রয়েড রেডি)
          </span>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-gray-700 flex-1">
          
          {/* Developer Credit Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs pb-1.5 border-b border-emerald-200/60">
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span>ডেভেলপার পরিচিতি (Developer Profile)</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider block">
                  ডেভেলপ করেছেন
                </span>
                <h4 className="text-sm font-bold text-gray-900 leading-tight">
                  Md. Tuhin Reza
                </h4>
                <p className="text-[11px] text-gray-600">
                  (মোঃ তুহিন রেজা)
                </p>
              </div>

              <div className="flex items-start space-x-2 pt-1 border-t border-emerald-100 text-[11px]">
                <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-800 block">
                    Diploma in Electrical Engineering
                  </span>
                  <span className="text-[10px] text-gray-600 block">
                    ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-[11px]">
                <Building2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-800 block">
                    Chapainawabganj Polytechnic Institute
                  </span>
                  <span className="text-[10px] text-gray-600 block">
                    চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px] pt-1 border-t border-emerald-100">
                <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <a
                  href="mailto:tuhinreza2005@gmail.com"
                  className="font-medium text-emerald-800 hover:underline select-text"
                >
                  tuhinreza2005@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* About App Features */}
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2 text-[11px]">
            <h5 className="font-bold text-gray-800 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>অ্যাপের বৈশিষ্ট্য ও সক্ষমতা</span>
            </h5>
            <ul className="space-y-1.5 text-gray-600">
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>৫০০–১০০০ ওয়াইফাই গ্রাহক পরিচালনা ও বকেয়া ট্র্যাকিং</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>সম্পূর্ণ অফলাইন-ফার্স্ট সুবিধা (ইন্টারনেট ছাড়াও কাজ করে)</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>সবুজ/হলুদ/লাল মাসিক বিলিং ক্যালেন্ডার ও ডিজিটাল রসিদ</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>বিকাশ, নগদ, রকেট ও নগদ টাকায় দ্রুত ফিল্ড কালেকশন</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>এক্সেলে গ্রাহক ইম্পোর্ট ও রিপোর্ট ডাউনলোড সুবিধা</span>
              </li>
            </ul>
          </div>

          {/* Current ISP info */}
          <div className="text-[11px] text-center text-gray-500 pt-1">
            বর্তমান ISP: <strong className="text-gray-800">{settings.companyName}</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 flex items-center space-x-1">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>in Bangladesh</span>
          </span>
          <button
            onClick={() => setIsAboutModalOpen(false)}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
          >
            ঠিক আছে
          </button>
        </div>

      </div>
    </div>
  );
};
