let d = new Date('2026-08-06T15:30:00Z');
d.setUTCDate(d.getUTCDate() - 29);
console.log(d.toISOString());
