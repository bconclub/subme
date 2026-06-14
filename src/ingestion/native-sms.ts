import { Platform } from 'react-native';

/**
 * Bridge to the native SMS-inbox reader.
 *
 * The actual reader is a small native module (Android NotificationListener is
 * a separate path; this one uses the SMS content provider behind the READ_SMS
 * permission). It only exists in a custom dev/preview build - NOT in Expo Go
 * and NOT on web. When absent, every call here reports "unavailable" so the
 * app falls back to other adapters (and the simulated feed) without crashing.
 *
 * Native task: implement `subme-sms` (see native/README.md) exposing
 *   requestPermission(): Promise<boolean>
 *   readInbox(sinceEpochMs: number): Promise<{ sender: string; body: string; date: number }[]>
 */

export interface RawSms {
  sender: string;
  body: string;
  /** epoch ms */
  date: number;
}

interface NativeSmsModule {
  requestPermission(): Promise<boolean>;
  readInbox(sinceEpochMs: number): Promise<RawSms[]>;
}

let cached: NativeSmsModule | null | undefined;

function load(): NativeSmsModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== 'android') {
    cached = null;
    return cached;
  }
  try {
    // Present only in a dev/preview build that bundled the native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../native/subme-sms');
    cached = (mod?.default ?? mod) as NativeSmsModule;
  } catch {
    cached = null;
  }
  return cached;
}

export function isNativeSmsAvailable(): boolean {
  return load() !== null;
}

export async function requestSmsPermission(): Promise<boolean> {
  const mod = load();
  if (!mod) return false;
  try {
    return await mod.requestPermission();
  } catch {
    return false;
  }
}

export async function readSmsInbox(sinceEpochMs: number): Promise<RawSms[]> {
  const mod = load();
  if (!mod) return [];
  try {
    return await mod.readInbox(sinceEpochMs);
  } catch {
    return [];
  }
}
