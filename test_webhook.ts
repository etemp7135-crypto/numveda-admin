import crypto from 'crypto';
import axios from 'axios';

const secret = 'numvedawebhook2026';
const payload = JSON.stringify({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_dummy123',
        order_id: 'order_dummy123',
        amount: 4900,
        status: 'captured'
      }
    }
  }
});

const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

async function test() {
  try {
    const res = await axios.post('https://numveda.vercel.app/api/webhook/razorpay', payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      }
    });
    console.log('Webhook Response:', res.status, res.data);
  } catch (err: any) {
    console.error('Webhook Error:', err.response ? err.response.data : err.message);
  }
}
test();
