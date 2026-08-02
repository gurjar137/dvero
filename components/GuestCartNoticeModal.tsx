'use client';
import { useRouter } from 'next/navigation';

type GuestCartNoticeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GuestCartNoticeModal({ isOpen, onClose }: GuestCartNoticeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  function handleAuth(path: string) {
    onClose();
    router.push(`${path}?redirect=${encodeURIComponent('/bag')}`);
  }

  return (
    <div
      className="fixed inset-0 z-[220] bg-ink/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg border-t sm:border border-line rounded-t-xl sm:rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-slideUp sm:animate-fadeIn space-y-5">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-mute hover:text-ink font-oswald text-xs uppercase min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          ✕
        </button>

        <div className="text-center space-y-2 pt-2 sm:pt-0">
          <div className="w-12 h-12 bg-panel border border-line rounded-full flex items-center justify-center mx-auto text-camelDeep font-bold text-xl mb-1 shadow-sm2">
            💼
          </div>
          <h3 className="font-cinzel text-xl tracking-[0.16em] uppercase text-ink">Save Your Shopping Bag</h3>
          <p className="text-mute text-xs sm:text-sm font-inter leading-relaxed max-w-xs mx-auto">
            You&rsquo;re currently shopping as a guest. Sign in or create a D'VERO account to securely save your Bag across devices and future visits.
          </p>
        </div>

        <div className="bg-panel border border-line rounded-md p-3.5 text-[0.72rem] text-mute font-inter text-center leading-relaxed">
          If you continue without signing in, your Bag may not be available the next time you visit.
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => handleAuth('/login')}
            className="w-full bg-ink text-bg font-oswald text-xs tracking-widest uppercase py-3.5 rounded-sm hover:bg-camelDeep transition-all min-h-[44px] shadow-sm2"
          >
            Sign In
          </button>

          <button
            onClick={() => handleAuth('/signup')}
            className="w-full border border-line bg-panel text-ink font-oswald text-xs tracking-widest uppercase py-3.5 rounded-sm hover:border-ink transition-all min-h-[44px]"
          >
            Create Account
          </button>

          <button
            onClick={onClose}
            className="w-full font-oswald text-xs tracking-wider uppercase text-mute hover:text-ink py-2 min-h-[44px]"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
