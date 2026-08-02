'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { WelcomeOverlay } from '@/components/WelcomeOverlay';
import { Toast } from '@/components/Toast';
import { AuthFormCore, AuthSuccessResult } from '@/components/AuthFormCore';

export function AuthForm({ initialMode }: { initialMode: 'login' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetRedirect = searchParams.get('redirect');
  const { session } = useAuth();
  const [welcomeOverlay, setWelcomeOverlay] = useState<{
    show: boolean;
    title: string;
    name?: string;
    subtitle: string;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (session && !welcomeOverlay && !toast && targetRedirect) {
      router.replace(targetRedirect);
    }
  }, [session, welcomeOverlay, toast, router, targetRedirect]);

  function switchModeHref(mode: 'login' | 'signup') {
    const qs = searchParams.toString();
    return qs ? `/${mode}?${qs}` : `/${mode}`;
  }

  function handleSuccess(result: AuthSuccessResult) {
    if (result.mode === 'signup') {
      setToast({ message: 'Welcome to DVERO.' });
      const dest = targetRedirect || '/';
      setTimeout(() => {
        router.replace(dest);
      }, 1400);
    } else {
      setWelcomeOverlay({
        show: true,
        title: 'Welcome Back,',
        name: result.name,
        subtitle: "We're delighted to see you again. Preparing your shopping experience...",
      });
    }
  }

  return (
    <>
      <main className="page-fade py-12 md:py-20 min-h-[60vh]">
        <div className="max-w-[420px] mx-auto px-5">
          <AuthFormCore
            initialMode={initialMode}
            onSuccess={handleSuccess}
            switchModeHrefFor={switchModeHref}
            variant="page"
          />
        </div>
      </main>

      {welcomeOverlay?.show && (
        <WelcomeOverlay
          title={welcomeOverlay.title}
          name={welcomeOverlay.name}
          subtitle={welcomeOverlay.subtitle}
          onComplete={() => router.replace(targetRedirect)}
        />
      )}

      {toast && <Toast message={toast.message} type="success" onClose={() => setToast(null)} />}
    </>
  );
}
