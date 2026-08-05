// Razorpay API wrapper — server-side only, never expose secrets
const KEY_ID = process.env.RAZORPAY_KEY_ID!;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

const BASE = 'https://api.razorpay.com/v1';

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
}

async function rzpFetch(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    next: { revalidate: 60 }, // cache for 60s
  });
  if (!res.ok) throw new Error(`Razorpay API error: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function fetchPayments(from: number, to: number, count = 100) {
  return rzpFetch('/payments', { from: String(from), to: String(to), count: String(count) });
}

export async function fetchPayment(id: string) {
  return rzpFetch(`/payments/${id}`);
}

export async function fetchOrders(from: number, to: number, count = 100) {
  return rzpFetch('/orders', { from: String(from), to: String(to), count: String(count) });
}

export async function fetchRefunds(from?: number, to?: number) {
  const params: Record<string, string> = { count: '100' };
  if (from) params.from = String(from);
  if (to) params.to = String(to);
  return rzpFetch('/refunds', params);
}

export async function fetchSettlements(count = 20) {
  return rzpFetch('/settlements', { count: String(count) });
}

export async function fetchPaymentMethods() {
  // Aggregate payment method breakdown from recent payments
  return rzpFetch('/payments', { count: '100' });
}

export async function testConnection(): Promise<boolean> {
  try {
    await rzpFetch('/payments', { count: '1' });
    return true;
  } catch { return false; }
}
