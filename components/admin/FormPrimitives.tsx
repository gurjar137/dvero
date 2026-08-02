'use client';

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-panel border border-line rounded px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-7 h-7 rounded border border-line cursor-pointer bg-transparent shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent text-xs font-mono text-ink outline-none"
        />
      </div>
    </div>
  );
}

export function ToggleSwitch({ label, checked, onChange }: { label?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className={`relative h-[22px] w-[40px] rounded-full transition-colors shrink-0 ${checked ? 'bg-ink' : 'bg-line'}`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-bg transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}
        />
      </span>
      {label && <span className="text-xs font-oswald uppercase text-ink">{label}</span>}
    </label>
  );
}

export function NumberSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="block text-[0.68rem] font-oswald uppercase text-mute">{label}</label>
        <span className="text-[0.68rem] font-mono text-ink">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-ink"
      />
    </div>
  );
}
