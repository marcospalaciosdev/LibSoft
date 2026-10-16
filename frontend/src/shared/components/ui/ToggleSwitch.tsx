import { useState, useEffect } from 'react';

interface ToggleSwitchProps {
  label?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (value: boolean) => void;
}

export function ToggleSwitch({ label, defaultChecked = false, checked, onChange }: ToggleSwitchProps) {
  const [enabled, setEnabled] = useState(checked !== undefined ? checked : defaultChecked);

  useEffect(() => {
    if (checked !== undefined) {
      setEnabled(checked);
    }
  }, [checked]);

  const handleToggle = () => {
    const newValue = !enabled;
    if (checked === undefined) {
      setEnabled(newValue);
    }
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <label className="flex items-center cursor-pointer gap-3 group">
      {/* Texto descriptivo opcional */}
      {label && (
        <span className="text-[rgb(var(--color-text))] font-medium text-[13px] group-hover:opacity-80 transition-opacity">
          {label}
        </span>
      )}

      <div className="relative flex items-center">
        {/* Input oculto (Checkbox) para accesibilidad */}
        <input
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={handleToggle}
        />

        {/* Fondo del Switch (Container) */}
        <div
          className={`w-10 h-6 rounded-full shadow-inner transition-colors duration-300 ease-in-out ${enabled
            ? 'bg-[rgb(var(--color-primary-600))]'
            : 'bg-[rgb(var(--color-border-strong))]/30 group-hover:bg-[rgb(var(--color-border-strong))]/40'
            }`}
        ></div>

        {/* Círculo Central (Handle) */}
        <div
          className={`absolute left-1 top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-black/5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${enabled ? 'translate-x-[14px]' : 'translate-x-0'
            }`}
        ></div>
      </div>
    </label>
  );
}