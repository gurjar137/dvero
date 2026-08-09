'use client';
import { Suspense } from 'react';
import { ConfirmationContent } from '@/components/ConfirmationContent';

export default function DynamicConfirmationPage({ params }: { params: { orderNumber: string } }) {
  return (
    <main className="page-fade min-h-[85vh] py-10 md:py-16 px-4 sm:px-6 relative overflow-hidden bg-bg">
      <Suspense
        fallback={
          <div className="max-w-xl mx-auto text-center py-24 space-y-4">
            <div className="w-12 h-12 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-oswald text-xs uppercase tracking-widest text-mute">Loading Order Confirmation...</p>
          </div>
        }
      >
        <ConfirmationContent orderNumberProp={params.orderNumber} />
      </Suspense>
    </main>
  );
}
