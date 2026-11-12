import React, { useState } from 'react';
import { ShieldCheck, Delete } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toBnNumber } from '../../utils/bengali';

export const PinLockModal: React.FC = () => {
  const { isPinAuthenticated, unlockWithPin, settings } = useApp();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (isPinAuthenticated) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = unlockWithPin(nextPin);
          if (!success) {
            setErrorMsg('ভুল পিন কোড! আবার চেষ্টা করুন।');
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-emerald-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs text-center flex flex-col items-center">
        {/* App Logo / Shield */}
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xl mb-4 text-emerald-300">
          <ShieldCheck className="w-9 h-9" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          {settings.companyName}
        </h2>
        <p className="text-emerald-200 text-xs mb-6">
          অ্যাপ আনলক করতে ৪ সংখ্যার পিন কোড দিন
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center space-x-4 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-400 scale-125 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                    : 'bg-white/20 border border-white/30'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg ? (
          <div className="text-rose-300 text-xs font-semibold mb-4 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-400/30">
            {errorMsg}
          </div>
        ) : (
          <div className="text-emerald-300/80 text-[11px] mb-4">
            ডিফল্ট পিন: ১২৩৪
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-emerald-500/30 text-white text-2xl font-bold flex items-center justify-center border border-white/15 transition active:scale-95 shadow-sm"
            >
              {toBnNumber(digit)}
            </button>
          ))}

          <button
            onClick={() => setPin('')}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 text-emerald-200 text-xs font-semibold flex items-center justify-center border border-white/10 active:scale-95 transition"
          >
            মুছে ফেলুন
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-emerald-500/30 text-white text-2xl font-bold flex items-center justify-center border border-white/15 transition active:scale-95 shadow-sm"
          >
            {toBnNumber('0')}
          </button>

          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 text-rose-300 flex items-center justify-center border border-white/10 active:scale-95 transition"
            aria-label="একটি সংখ্যা মুছুন"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
