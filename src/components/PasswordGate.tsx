'use client';

import React, { useState } from 'react';

interface PasswordGateProps {
    passwordHash?: string;
    onUnlock: () => void;
}

const hashText = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

export const PasswordGate: React.FC<PasswordGateProps> = ({ passwordHash = '', onUnlock }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!passwordHash) {
            setError('Password is not configured. Please set VITE_APP_GUARD_HASH.');
            return;
        }
        setIsLoading(true);
        try {
            const hashed = await hashText(input.trim());
            if (hashed === passwordHash) {
                onUnlock();
            } else {
                setError('Incorrect password.');
            }
        } catch (err) {
            console.error('Password hash failed', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900/70 border border-slate-700 rounded-2xl shadow-2xl p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Restricted Area</p>
                        <h1 className="text-xl font-semibold text-white mt-1">Enter Access Code</h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-slate-300">Password</label>
                        <input
                            type="password"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter password"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                        {isLoading ? 'Verifying...' : 'Unlock'}
                    </button>
                </form>
            </div>
        </div>
    );
};
