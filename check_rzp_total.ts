import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function check() {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  
  let skip = 0;
  let rzpPayments: any[] = [];
  
  const fromUnix = Math.floor(new Date("2026-07-19T00:00:00.000Z").getTime() / 1000);
  const toUnix = Math.floor(new Date("2026-08-14T23:59:59.999Z").getTime() / 1000);

  while (true) {
    const res = await axios.get(`https://api.razorpay.com/v1/payments?count=100&skip=${skip}&from=${fromUnix}&to=${toUnix}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const items = res.data.items;
    if (!items || items.length === 0) break;
    rzpPayments = rzpPayments.concat(items);
    skip += 100;
  }
  
  let capturedTotal = 0;
  for (const p of rzpPayments) {
    if (p.status === 'captured') {
        capturedTotal += (p.amount / 100);
    }
  }
  console.log("Razorpay Captured Total from July 19 to Aug 14:", capturedTotal);

  process.exit(0);
}

check();
