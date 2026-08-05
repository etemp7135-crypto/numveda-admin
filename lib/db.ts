import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

let cached = (global as any).__mongoose;
if (!cached) cached = (global as any).__mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ─── Order Schema (existing) ─────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  order_id: String,
  payment_id: String,
  status: { type: String, default: 'pending' },
  amount: Number,
  currency: { type: String, default: 'INR' },
  customer_details: mongoose.Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now },
}, { collection: 'orders' });

// ─── Event Schema (new — for funnel analytics) ───────────────────────────────
const eventSchema = new mongoose.Schema({
  session_id: { type: String, index: true },
  event_name: { type: String, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  // Quiz
  question_id: String,
  answer_value: String,
  category: String,
  step_number: Number,
  report_type: String, // 'master' | 'ultimate'
  // Financial
  amount: Number,
  order_id: String,
  payment_id: String,
  // Attribution
  utm_source: String,
  utm_medium: String,
  utm_campaign: String,
  utm_content: String,
  utm_term: String,
  referrer: String,
  landing_page: String,
  // Device
  device_type: String,
  browser: String,
  os: String,
  screen_width: Number,
  // User
  user_name: String,
  user_phone_hash: String,
  // Meta
  ip_hash: String,
}, { collection: 'events' });

// ─── Session Schema (new) ────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema({
  session_id: { type: String, unique: true, index: true },
  started_at: { type: Date, default: Date.now, index: true },
  last_active: { type: Date, default: Date.now },
  utm_source: String,
  utm_medium: String,
  utm_campaign: String,
  utm_content: String,
  referrer: String,
  landing_page: String,
  device_type: String,
  browser: String,
  os: String,
  events: [String],
  category_selected: String,
  current_step: Number,
  max_step_reached: { type: Number, default: 0 },
  reached_checkout: { type: Boolean, default: false },
  payment_attempted: { type: Boolean, default: false },
  payment_success: { type: Boolean, default: false },
  order_id: String,
  amount: Number,
  report_type: String,
  is_converted: { type: Boolean, default: false, index: true },
}, { collection: 'sessions' });

// ─── MetaTopup Schema (new — for cash reconciliation) ────────────────────────
const metaTopupSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, index: true },
  amount: { type: Number, required: true }, // Total cash paid (including GST)
  gst_amount: { type: Number, required: true }, // GST portion of the cash
  media_budget_added: { type: Number, required: true }, // amount - gst_amount
  reference: String,
}, { collection: 'meta_topups' });

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
export const MetaTopup = mongoose.models.MetaTopup || mongoose.model('MetaTopup', metaTopupSchema);
