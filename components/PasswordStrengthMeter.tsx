'use client';

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const label = score <= 2 ? 'Weak' : score <= 3 ? 'Fair' : score <= 4 ? 'Good' : 'Strong';
  const color = score <= 2 ? 'bg-error' : score <= 3 ? 'bg-amber-600' : 'bg-camelDeep';
  const widthPct = (score / 5) * 100;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-[0.68rem] font-oswald uppercase text-mute">
        <span>Password Strength</span>
        <span className="text-ink font-semibold">{label}</span>
      </div>
      <div className="w-full bg-line h-1.5 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${color}`} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  );
}
