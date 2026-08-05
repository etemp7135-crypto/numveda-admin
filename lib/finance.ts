// P&L Finance calculation engine
// All figures in INR (paise from Razorpay are converted)

export const GST_RATE = 0.18; // 18% GST
export const RAZORPAY_FEE_RATE = 0.02; // ~2% processing fee (actual varies by method)

export interface PLInput {
  grossRevenue: number;
  refunds: number;
  razorpayFees: number;      // actual fees from Razorpay API
  metaMediaSpend: number;    // pure media spend from Meta API
  otherExpenses: number;     // configurable
  applyGSTOnRazorpay: boolean; // Indian accounts pay 18% GST on fees
  applyGSTOnMeta: boolean;     // Indian accounts pay 18% GST on Meta ads
}

export interface PLResult {
  // Revenue
  grossRevenue: number;
  refunds: number;
  razorpayFees: number;
  razorpayGST: number;
  netSales: number;
  netRazorpayRevenue: number;
  // Advertising
  metaMediaSpend: number;
  metaGST: number;
  totalMetaCashCost: number;
  // Other
  otherExpenses: number;
  totalCosts: number;
  // Final
  actualProfit: number;
  profitMargin: number;
  roas: number;
  cashRoas: number;
  mer: number; // Marketing Efficiency Ratio = Revenue / Total Marketing Cash Spend
}

export function calculatePL(input: PLInput): PLResult {
  const { grossRevenue, refunds, razorpayFees, metaMediaSpend, otherExpenses,
          applyGSTOnRazorpay, applyGSTOnMeta } = input;

  const netSales = grossRevenue - refunds;
  
  // Razorpay Calculation
  const razorpayGST = applyGSTOnRazorpay ? razorpayFees * GST_RATE : 0;
  const netRazorpayRevenue = grossRevenue - razorpayFees - razorpayGST; // strict net

  // Meta Calculation
  const metaGST = applyGSTOnMeta ? metaMediaSpend * GST_RATE : 0;
  const totalMetaCashCost = metaMediaSpend + metaGST;

  // Total Costs
  const totalCosts = razorpayFees + razorpayGST + totalMetaCashCost + otherExpenses;
  
  // Actual Profit
  const actualProfit = netRazorpayRevenue - totalMetaCashCost - otherExpenses;
  
  // Margins & Ratios
  const profitMargin = grossRevenue > 0 ? (actualProfit / grossRevenue) * 100 : 0;
  const roas = metaMediaSpend > 0 ? grossRevenue / metaMediaSpend : 0;
  const cashRoas = totalMetaCashCost > 0 ? grossRevenue / totalMetaCashCost : 0;
  const totalMarketingCashCost = totalMetaCashCost + otherExpenses;
  const mer = totalMarketingCashCost > 0 ? grossRevenue / totalMarketingCashCost : 0;

  return {
    grossRevenue, refunds, netSales,
    razorpayFees, razorpayGST, netRazorpayRevenue,
    metaMediaSpend, metaGST, totalMetaCashCost,
    otherExpenses, totalCosts,
    actualProfit, profitMargin, roas, cashRoas, mer,
  };
}

export function estimateRazorpayFees(amount: number, method = 'upi'): number {
  // Razorpay fee structure (approximate)
  switch (method) {
    case 'upi': return amount * 0.0009; // 0% for UPI < ₹2000, else 0.09%
    case 'card': return amount * 0.02; // 2% for cards
    case 'netbanking': return amount * 0.015; // 1.5%
    default: return amount * 0.02;
  }
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: decimals }).format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}
