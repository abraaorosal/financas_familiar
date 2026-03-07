import { useEffect, useState } from 'react';
import { formatCurrencyFromCents, parseCurrencyInputToCents } from '@/shared/utils/currency';

interface CurrencyInputProps {
  id?: string;
  valueInCents: number;
  onChange: (valueInCents: number) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput = ({ id, valueInCents, onChange, placeholder, className }: CurrencyInputProps) => {
  const [raw, setRaw] = useState<string>(valueInCents ? String(valueInCents) : '');

  useEffect(() => {
    setRaw(valueInCents ? String(valueInCents) : '');
  }, [valueInCents]);

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setRaw(digits);
    onChange(parseCurrencyInputToCents(digits));
  };

  return (
    <div className={`rounded-lg border border-slate-200 bg-white px-3 py-2 ${className ?? ''}`}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder ?? '0'}
        className="w-full border-none bg-transparent text-base outline-none"
        aria-label="Valor"
      />
      <p className="mt-1 text-xs text-slate-500">{formatCurrencyFromCents(parseCurrencyInputToCents(raw))}</p>
    </div>
  );
};
