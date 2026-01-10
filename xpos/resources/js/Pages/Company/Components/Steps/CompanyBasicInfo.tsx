import { useState, useEffect } from 'react';
import WizardStep from '../WizardStep';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { SetupWizardData } from '../../Utils/setupHelpers';
import axios from 'axios';

type Props = {
  data: SetupWizardData;
  setData: (key: keyof SetupWizardData, value: any) => void;
  errors: Record<string, string>;
  onValidationChange?: (hasErrors: boolean) => void;
  currencies?: Array<{
    code: string;
    name: string;
    symbol: string;
    decimal_places: number;
    symbol_position: string;
  }>;
};

export default function CompanyBasicInfo({ data, setData, errors, onValidationChange, currencies = [] }: Props) {
  const [nameValidation, setNameValidation] = useState<{ checking: boolean; error: string | null }>({
    checking: false,
    error: null,
  });
  const [tinValidation, setTinValidation] = useState<{ checking: boolean; error: string | null }>({
    checking: false,
    error: null,
  });

  // Debounce timer refs
  const nameTimerRef = useState<NodeJS.Timeout | null>(null)[0];
  const tinTimerRef = useState<NodeJS.Timeout | null>(null)[0];

  // Check company name availability
  useEffect(() => {
    if (!data.company_name || data.company_name.trim().length < 2) {
      setNameValidation({ checking: false, error: null });
      return;
    }

    if (nameTimerRef) clearTimeout(nameTimerRef);

    const timer = setTimeout(async () => {
      setNameValidation({ checking: true, error: null });

      try {
        console.log('Checking company name:', data.company_name);
        const response = await axios.post(route('company.check-name'), {
          name: data.company_name,
        });
        console.log('Response:', response.data);

        if (!response.data.available) {
          setNameValidation({ checking: false, error: response.data.message });
        } else {
          setNameValidation({ checking: false, error: null });
        }
      } catch (error) {
        console.error('Error checking company name:', error);
        setNameValidation({ checking: false, error: 'Yoxlama zamanı xəta baş verdi' });
      }
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [data.company_name]);

  // Check TIN availability
  useEffect(() => {
    if (!data.tax_number || data.tax_number.trim().length < 2) {
      setTinValidation({ checking: false, error: null });
      return;
    }

    if (tinTimerRef) clearTimeout(tinTimerRef);

    const timer = setTimeout(async () => {
      setTinValidation({ checking: true, error: null });

      try {
        console.log('Checking TIN:', data.tax_number);
        const response = await axios.post(route('company.check-tin'), {
          tin: data.tax_number,
        });
        console.log('Response:', response.data);

        if (!response.data.available) {
          setTinValidation({ checking: false, error: response.data.message });
        } else {
          setTinValidation({ checking: false, error: null });
        }
      } catch (error) {
        console.error('Error checking TIN:', error);
        setTinValidation({ checking: false, error: 'Yoxlama zamanı xəta baş verdi' });
      }
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [data.tax_number]);

  // Notify parent about validation state
  useEffect(() => {
    const hasErrors = !!(nameValidation.error || tinValidation.error || nameValidation.checking || tinValidation.checking);
    onValidationChange?.(hasErrors);
  }, [nameValidation, tinValidation, onValidationChange]);

  return (
    <WizardStep title="Şirkət məlumatları" description="Əsas şirkət məlumatlarını daxil edin.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <InputLabel htmlFor="company_name" value="Şirkət adı *" />
          <div className="relative">
            <TextInput
              id="company_name"
              value={data.company_name}
              onChange={(e) => setData('company_name', e.target.value)}
              className={`mt-1 w-full ${nameValidation.error ? 'border-red-500' : nameValidation.checking ? 'border-yellow-500' : ''}`}
            />
            {nameValidation.checking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          <InputError message={nameValidation.error || errors.company_name} className="mt-1" />
          {!nameValidation.error && !nameValidation.checking && data.company_name && data.company_name.trim().length >= 2 && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              İstifadə oluna bilər
            </p>
          )}
        </div>
        <div>
          <InputLabel htmlFor="tax_number" value="VOEN" />
          <div className="relative">
            <TextInput
              id="tax_number"
              value={data.tax_number}
              onChange={(e) => setData('tax_number', e.target.value)}
              className={`mt-1 w-full ${tinValidation.error ? 'border-red-500' : tinValidation.checking ? 'border-yellow-500' : ''}`}
            />
            {tinValidation.checking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          <InputError message={tinValidation.error || errors.tax_number} className="mt-1" />
          {!tinValidation.error && !tinValidation.checking && data.tax_number && data.tax_number.trim().length >= 2 && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              İstifadə oluna bilər
            </p>
          )}
        </div>
        <div>
          <InputLabel htmlFor="address" value="Ünvan" />
          <TextInput id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.address} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="phone" value="Telefon" />
          <TextInput id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.phone} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="email" value="E-poçt" />
          <TextInput id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.email} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="website" value="Veb sayt" />
          <TextInput id="website" value={data.website} onChange={(e) => setData('website', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.website} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <InputLabel htmlFor="description" value="Təsvir" />
          <TextInput id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.description} className="mt-1" />
        </div>

        {/* Currency Selection */}
        <div>
          <InputLabel htmlFor="currency_code" value="Valyuta *" />
          <select
            id="currency_code"
            value={data.currency_code || 'AZN'}
            onChange={(e) => setData('currency_code', e.target.value)}
            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
          <InputError message={errors.currency_code} className="mt-1" />
          <p className="mt-1 text-xs text-gray-500">
            Sistemdə istifadə olunacaq əsas valyuta
          </p>
        </div>

        {/* Language Selection */}
        <div>
          <InputLabel htmlFor="default_language" value="Dil" />
          <select
            id="default_language"
            value={data.default_language || 'az'}
            onChange={(e) => setData('default_language', e.target.value)}
            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
          >
            <option value="az">Azərbaycanca</option>
            <option value="en">English</option>
          </select>
          <InputError message={errors.default_language} className="mt-1" />
          <p className="mt-1 text-xs text-gray-500">
            Sistemin interfeys dili (istəyə bağlı)
          </p>
        </div>
      </div>
    </WizardStep>
  );
}
