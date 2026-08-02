import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-oswald text-xs uppercase text-mute">Loading D'VERO Portal...</div>}>
      <AuthForm initialMode="signup" />
    </Suspense>
  );
}
