require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch'); // we'll just use global fetch in Node 18+

async function test() {
  const token = process.env.META_ACCESS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;
  console.log('Token starts with:', token ? token.substring(0, 10) : 'none');
  console.log('Account:', account);
  
  const url = `https://graph.facebook.com/v21.0/act_${account}/insights?access_token=${token}&date_preset=maximum`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    
    // Also try transactions
    const txUrl = `https://graph.facebook.com/v21.0/act_${account}/transactions?access_token=${token}&limit=5`;
    const txRes = await fetch(txUrl);
    const txData = await txRes.json();
    console.log("Transactions:", JSON.stringify(txData, null, 2));
    
  } catch (e) {
    console.error(e);
  }
}
test();
