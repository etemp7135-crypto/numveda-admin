import { getDateRange } from './lib/analytics';
console.log('Today:', getDateRange('today'));
console.log('Yesterday:', getDateRange('yesterday'));
console.log('7d:', getDateRange('7d'));
