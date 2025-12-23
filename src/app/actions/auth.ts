'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { serverEnv } from '@/config/env';

/**
 * Computes a SHA-256 hash of the input text
 */
async function computeHash(text: string): Promise<string> {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Verifies the password against the environment secret and sets a session cookie.
 */
export async function verifyPasswordAction(password: string) {
  const passwordHash = serverEnv.APP_GUARD_HASH;
  
  if (!passwordHash) {
    console.error('[AuthAction] APP_GUARD_HASH is not configured on the server.');
    return { success: false, error: 'Server configuration error' };
  }

  const hashed = await computeHash(password.trim());
  
  if (hashed === passwordHash) {
    const cookieStore = await cookies();
    cookieStore.set('app_access_granted', '1', {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    return { success: true };
  }

  return { success: false, error: 'Incorrect password' };
}

/**
 * Clears the session cookie
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('app_access_granted');
}

/**
 * Check if the user is authorized on the server side
 */
export async function isAuthorizedAction() {
  const cookieStore = await cookies();
  return cookieStore.has('app_access_granted');
}
