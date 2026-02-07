import React, { useState } from 'react';
import { useFocusMaintainer } from '../hooks/useFocusMaintainer';

interface Props {
  onScan: (code: string) => void;
  isLoading?: boolean;
}

export const ScannerInput: React.FC<Props> = ({ onScan, isLoading }) => {
  const inputRef = useFocusMaintainer();
  const [value, setValue] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim()) {
      onScan(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="relative w-full">
        {/* Visual Input Representation (Mock) */}
        <div className="relative flex items-center group">
            <span className="material-symbols-outlined absolute left-3 text-primary text-xl z-10 dark:group-focus-within:text-white group-focus-within:text-gray-900 transition-colors">barcode_scanner</span>
            <div className="w-full dark:bg-black/40 bg-gray-100 border dark:border-primary/30 border-primary/50 rounded-lg py-3 pl-10 pr-16 text-base font-bold dark:text-white text-gray-900 shadow-inner flex items-center h-[50px] overflow-hidden relative">
                <span className={`transition-opacity duration-200 ${value ? 'opacity-100' : 'dark:opacity-20 opacity-40'}`}>
                    {value || "请扫描单号..."}
                </span>

                {/* The REAL input - Hidden but functional */}
                <input
                    ref={inputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text caret-transparent"
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    inputMode="none" // Try to prevent virtual keyboard on mobile
                />
            </div>

            <button
                onClick={() => handleSubmit()}
                className="absolute right-2 z-20 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded font-bold text-xs uppercase shadow-lg active:scale-95 transition-all disabled:opacity-50"
                disabled={!value}
            >
                确认
            </button>
        </div>
    </div>
  );
};