// Supabase Edge Function: notify-signup
// Sends a WhatsApp message to the admin whenever a new user registers
// (email + phone captured). Wire it as a Database Webhook on
// `public.profiles` INSERT, or call from the auth `on_new_user` trigger.
//
// Deploy:  supabase functions deploy notify-signup
// Secrets: supabase secrets set WHATSAPP_PROVIDER=... (+ provider keys, ADMIN_ALERT_WHATSAPP_TO)
//
// Provider is chosen via WHATSAPP_PROVIDER = cloud | gupshup | twilio.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

interface ProfileRow {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
}

const env = (k: string) => Deno.env.get(k) ?? '';

async function sendWhatsApp(to: string, text: string): Promise<Response> {
  const provider = env('WHATSAPP_PROVIDER');

  if (provider === 'cloud') {
    const id = env('WHATSAPP_CLOUD_PHONE_NUMBER_ID');
    return fetch(`https://graph.facebook.com/v21.0/${id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env('WHATSAPP_CLOUD_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
  }

  if (provider === 'gupshup') {
    const body = new URLSearchParams({
      channel: 'whatsapp',
      source: env('GUPSHUP_SOURCE_NUMBER'),
      destination: to,
      'src.name': env('GUPSHUP_APP_NAME'),
      message: JSON.stringify({ type: 'text', text }),
    });
    return fetch('https://api.gupshup.io/wa/api/v1/msg', {
      method: 'POST',
      headers: { apikey: env('GUPSHUP_API_KEY'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  }

  if (provider === 'twilio') {
    const sid = env('TWILIO_ACCOUNT_SID');
    const body = new URLSearchParams({
      From: `whatsapp:${env('TWILIO_WHATSAPP_FROM')}`,
      To: `whatsapp:${to}`,
      Body: text,
    });
    return fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${sid}:${env('TWILIO_AUTH_TOKEN')}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }

  return new Response('no provider configured', { status: 500 });
}

serve(async (req) => {
  try {
    const payload = await req.json();
    // Database Webhook shape: { type, table, record }
    const row: ProfileRow = payload.record ?? payload;
    const admin = env('ADMIN_ALERT_WHATSAPP_TO');
    if (!admin) return new Response('no admin number', { status: 500 });

    const msg =
      `🎉 New Subme signup\n` +
      `Name: ${row.full_name ?? '—'}\n` +
      `Email: ${row.email ?? '—'}\n` +
      `Phone: ${row.phone ?? '—'}`;

    const res = await sendWhatsApp(admin, msg);
    const ok = res.ok;
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
