import { ShoppingCartIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface Props {
  mode: 'sale' | 'service';
  onChange: (mode: 'sale' | 'service') => void;
}

function ModeSelector({ mode, onChange }: Props) {
  return (
    <div className="bg-white shadow-sm sm:rounded-lg mb-6">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="radio"
              value="sale"
              checked={mode === 'sale'}
              onChange={(e) => onChange(e.target.value as 'sale' | 'service')}
              className="mr-2"
            />
            <ShoppingCartIcon className="h-5 w-5 mr-2 text-blue-600" />
            <span className="text-lg font-medium">Satış</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="service"
              checked={mode === 'service'}
              onChange={(e) => onChange(e.target.value as 'sale' | 'service')}
              className="mr-2"
            />
            <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-green-600" />
            <span className="text-lg font-medium">Servis</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ModeSelector);

