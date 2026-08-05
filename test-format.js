const { format } = require('date-fns');

// Imagine range.from is midnight IST in UTC
const from = new Date('2026-08-05T18:30:00.000Z');

console.log("Localhost date-fns format:", format(from, 'yyyy-MM-dd'));

const istOffset = 5.5 * 60 * 60 * 1000;
console.log("New explicit format:", new Date(from.getTime() + istOffset).toISOString().split('T')[0]);

