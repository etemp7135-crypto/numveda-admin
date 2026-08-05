function getDateRange(period) {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);
  
  let fromIST = new Date(istTime);
  let toIST = new Date(istTime);

  switch (period) {
    case 'today':
      fromIST.setUTCHours(0, 0, 0, 0);
      toIST.setUTCHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      fromIST.setUTCDate(fromIST.getUTCDate() - 1);
      fromIST.setUTCHours(0, 0, 0, 0);
      toIST.setUTCDate(toIST.getUTCDate() - 1);
      toIST.setUTCHours(23, 59, 59, 999);
      break;
  }
  
  return { 
    from: new Date(fromIST.getTime() - IST_OFFSET_MS), 
    to: new Date(toIST.getTime() - IST_OFFSET_MS) 
  };
}
console.log('Now:', new Date().toISOString());
console.log('Today:', getDateRange('today'));
console.log('Yesterday:', getDateRange('yesterday'));
