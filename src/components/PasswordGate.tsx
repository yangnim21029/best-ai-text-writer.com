'use client';

import React, { useActionState } from 'react';
import { verifyPasswordAction } from '@/app/actions/auth';

interface PasswordGateProps {
  passwordHash?: string;
  onUnlock: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onUnlock }) => {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const password = formData.get('password') as string;
      try {
        const result = await verifyPasswordAction(password);
        if (result.success) {
          onUnlock();
          return { success: true, error: '' };
        }
        return { success: false, error: result.error || 'Incorrect password.' };
      } catch (err) {
        return { success: false, error: 'Something went wrong. Please try again.' };
      }
    },
    { success: false, error: '' }
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-700 rounded-2xl shadow-2xl p-6 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Restricted Area</p>
            <h1 className="text-xl font-semibold text-white mt-1">Enter Access Code</h1>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              name="password"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter password"
              autoFocus
              suppressHydrationWarning
            />
          </div>

          {state.error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {isPending ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
};
