const token = 'EAAWJZBoLG2psBSSJR8q4ivKDLWpm8H8ZBzbiwoHtARsgYKyT6yeZA9mAGemfG0kl4qUcNBc6JyZCXo0rPnx4c2W6CWbq3cPh3OaRfEVamenCOIZByolwDNXsi2bZBn1gZAXNvYwV7cFYeUFW9iZBKfGiPyvJouNMjYsNPAu1u9dKX3466eQ9YzB5NZApkMuoSGtATrNEgZCTbVRTlB1qq2V1VZCAuY0Fb3nXaRHTWY9p6x0';
const accountId = '1074554091808150';

fetch(`https://graph.facebook.com/v21.0/act_${accountId}?fields=id,name&access_token=${token}`)
  .then(res => res.json())
  .then(data => console.log('Result:', data))
  .catch(err => console.error(err));
