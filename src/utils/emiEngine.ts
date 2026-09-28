import { EMICalculationResult } from '../types';

export function calculateEMI(
  principal: number,
  annualInterestRate: number,
  tenure: number,
  tenureUnit: 'months' | 'years'
): EMICalculationResult {
  const P = Math.max(0, principal);
  const totalMonths = tenureUnit === 'years' ? Math.max(1, tenure * 12) : Math.max(1, tenure);

  if (P <= 0) {
    return {
      monthlyEMI: 0,
      principalAmount: 0,
      totalInterest: 0,
      totalRepayment: 0,
      interestRatio: 0,
      schedule: [],
    };
  }

  // Monthly rate
  const r = annualInterestRate / 12 / 100;

  let monthlyEMI = 0;
  if (r === 0) {
    monthlyEMI = P / totalMonths;
  } else {
    // Formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const factor = Math.pow(1 + r, totalMonths);
    monthlyEMI = (P * r * factor) / (factor - 1);
  }

  const totalRepayment = monthlyEMI * totalMonths;
  const totalInterest = Math.max(0, totalRepayment - P);
  const interestRatio = totalRepayment > 0 ? (totalInterest / totalRepayment) * 100 : 0;

  // Generate monthly amortization schedule
  let currentBalance = P;
  const schedule: EMICalculationResult['schedule'] = [];

  for (let m = 1; m <= totalMonths; m++) {
    const interestForMonth = currentBalance * r;
    const principalForMonth = Math.min(currentBalance, monthlyEMI - interestForMonth);
    currentBalance = Math.max(0, currentBalance - principalForMonth);

    schedule.push({
      month: m,
      year: Math.ceil(m / 12),
      emi: Math.round(monthlyEMI),
      principal: Math.round(principalForMonth),
      interest: Math.round(interestForMonth),
      balance: Math.round(currentBalance),
    });
  }

  return {
    monthlyEMI: Math.round(monthlyEMI),
    principalAmount: Math.round(P),
    totalInterest: Math.round(totalInterest),
    totalRepayment: Math.round(totalRepayment),
    interestRatio: parseFloat(interestRatio.toFixed(1)),
    schedule,
  };
}
