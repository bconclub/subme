import type { IngestionAdapter, NormalizedTransaction } from './types';
import { parseSmsTransaction } from './sms-parse';
import {
  isNativeSmsAvailable,
  readSmsInbox,
  requestSmsPermission,
} from './native-sms';

/**
 * SMS adapter - the first real source. Reads the device SMS inbox (last 90
 * days) and normalizes bank/UPI debit messages. Available only in a build
 * that bundled the native SMS module and was granted READ_SMS.
 */
export const smsAdapter: IngestionAdapter & {
  ensurePermission: () => Promise<boolean>;
} = {
  source: 'sms',
  async isAvailable() {
    return isNativeSmsAvailable();
  },
  async ensurePermission() {
    return requestSmsPermission();
  },
  async collect() {
    const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const raw = await readSmsInbox(since);
    const out: NormalizedTransaction[] = [];
    for (const m of raw) {
      const tx = parseSmsTransaction(m.body, new Date(m.date).toISOString(), m.sender);
      if (tx) out.push(tx);
    }
    return out;
  },
};

/**
 * Simulated source - a handful of realistic Indian bank SMS, so the full
 * detect → review → confirm loop is demonstrable in Expo Go / web before the
 * native SMS build exists. Marked clearly; remove or gate behind a debug flag
 * for production.
 */
const SAMPLE_SMS: { sender: string; body: string; daysAgo: number }[] = [
  { sender: 'HDFCBK', body: 'INR 649.00 spent on HDFC Bank Card xx4821 at NETFLIX.COM on {d}. Avl bal INR 42,300', daysAgo: 2 },
  { sender: 'AXISBK', body: 'Rs.119.00 debited from A/c XX7711 on {d} to Spotify India via UPI. Ref 5521903', daysAgo: 5 },
  { sender: 'ICICIB', body: 'Your a/c XX1190 is debited for Rs 1,999.00 on {d} towards OPENAI ChatGPT. UPI Ref 88123', daysAgo: 8 },
  { sender: 'SBIINB', body: 'Rs 349 spent at JIO PREPAID RECHARGE on {d} from A/c xx2245. Not you? Call 1800', daysAgo: 1 },
  { sender: 'HDFCBK', body: 'INR 399.00 spent on Card xx4821 at SWIGGY ONE MEMBERSHIP on {d}', daysAgo: 11 },
  { sender: 'VK-AMZN', body: 'Your OTP for Amazon login is 552210. Valid 10 min. Do not share.', daysAgo: 1 },
  { sender: 'AXISBK', body: 'Rs 250.00 spent at MORE SUPERMARKET on {d} via Card XX7711', daysAgo: 3 },
];

function ddMonYy(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86400000);
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  return `${String(d.getDate()).padStart(2, '0')}-${mon}-${String(d.getFullYear()).slice(2)}`;
}

export const simulatedSmsAdapter: IngestionAdapter = {
  source: 'sms',
  async isAvailable() {
    return true;
  },
  async collect() {
    const out: NormalizedTransaction[] = [];
    for (const s of SAMPLE_SMS) {
      const body = s.body.replace('{d}', ddMonYy(s.daysAgo));
      const tx = parseSmsTransaction(body, new Date(Date.now() - s.daysAgo * 86400000).toISOString(), s.sender);
      if (tx) out.push(tx);
    }
    return out;
  },
};
