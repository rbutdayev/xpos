import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface NumpadProps {
  isOpen: boolean;
  title: string;
  initialValue?: number;
  maxValue?: number;
  onSubmit: (value: number) => void;
  onClose: () => void;
}

export default function Numpad({ isOpen, title, initialValue = 0, maxValue, onSubmit, onClose }: NumpadProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue.toString());

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue.toString());
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleNumberClick = (num: string) => {
    if (value === '0') {
      setValue(num);
    } else {
      const newValue = value + num;
      if (maxValue && parseFloat(newValue) > maxValue) {
        return;
      }
      setValue(newValue);
    }
  };

  const handleBackspace = () => {
    if (value.length === 1) {
      setValue('0');
    } else {
      setValue(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    setValue('0');
  };

  const handleDecimal = () => {
    if (!value.includes('.')) {
      setValue(value + '.');
    }
  };

  const handleSubmit = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onSubmit(numValue);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key >= '0' && e.key <= '9') {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Delete' || e.key === 'Escape') {
        handleClear();
      } else if (e.key === '.' || e.key === ',') {
        handleDecimal();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, value]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="gradient-primary px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-all active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Display */}
        <div className="p-6 bg-gray-50 border-b-2 border-gray-200">
          <div className="bg-white rounded-lg px-6 py-4 text-right border-2 border-blue-200">
            <div className="text-4xl font-bold text-gray-900 font-mono">
              {value}
            </div>
          </div>
        </div>

        {/* Numpad */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className="numpad-btn"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleDecimal}
              className="numpad-btn"
            >
              .
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="numpad-btn"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="numpad-btn bg-gray-100"
            >
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={handleClear}
              className="btn btn-secondary py-4"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-success py-4"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
