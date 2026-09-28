import React, { useState, useMemo } from 'react';
import { Calculator, RotateCcw, PieChart, Calendar, ChevronRight, IndianRupee, DollarSign } from 'lucide-react';
import { calculateEMI } from '../../utils/emiEngine';
import { formatCurrency } from '../../utils/formatters';

export const EmiCalculatorTool: React.FC = () => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [principal, setPrincipal] = useState<number>(1000000); // 10 Lakhs or $1M
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5%
  const [tenure, setTenure] = useState<number>(5); // 5 years
  const [tenureUnit, setTenureUnit] = useState<'months' | 'years'>('years');
  const [scheduleView, setScheduleView] = useState<'yearly' | 'monthly'>('yearly');

  const result = useMemo(() => {
    return calculateEMI(principal, interestRate, tenure, tenureUnit);
  }, [principal, interestRate, tenure, tenureUnit]);

  const handleReset = () => {
    setPrincipal(1000000);
    setInterestRate(8.5);
    setTenure(5);
    setTenureUnit('years');
  };

  // Group monthly schedule into yearly summary for easy reading
  const yearlySchedule = useMemo(() => {
    const yearsMap: Record<
      number,
      { year: number; emi: number; principal: number; interest: number; balance: number }
    > = {};

    result.schedule.forEach((row) => {
      if (!yearsMap[row.year]) {
        yearsMap[row.year] = {
          year: row.year,
          emi: 0,
          principal: 0,
          interest: 0,
          balance: row.balance,
        };
      }
      yearsMap[row.year].emi += row.emi;
      yearsMap[row.year].principal += row.principal;
      yearsMap[row.year].interest += row.interest;
      yearsMap[row.year].balance = row.balance; // year end balance
    });

    return Object.values(yearsMap);
  }, [result.schedule]);

  return (
    <div className="space-y-6">
      {/* Currency & reset toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Currency:</span>
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-900">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                currency === 'INR'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                currency === 'USD'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              $ USD
            </button>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input sliders (6 cols) */}
        <div className="lg:col-span-6 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-6">
          {/* Loan Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Loan Amount (Principal)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1000"
                  max="100000000"
                  step="5000"
                  value={principal}
                  onChange={(e) => setPrincipal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-36 text-sm font-bold font-mono text-right p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                />
              </div>
            </div>
            <input
              type="range"
              min="10000"
              max={currency === 'INR' ? 10000000 : 1000000}
              step="10000"
              value={principal}
              onChange={(e) => setPrincipal(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>{formatCurrency(10000, currency)}</span>
              <span>{formatCurrency(currency === 'INR' ? 10000000 : 1000000, currency)}</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Annual Interest Rate (% p.a.)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="35"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="w-20 text-sm font-bold font-mono text-right p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
            </div>
            <input
              type="range"
              min="3"
              max="25"
              step="0.25"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>3%</span>
              <span>12%</span>
              <span>25%</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Loan Tenure
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={tenureUnit === 'years' ? 35 : 420}
                  value={tenure}
                  onChange={(e) => setTenure(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-sm font-bold font-mono text-right p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                />
                <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                  <button
                    onClick={() => {
                      if (tenureUnit === 'months') {
                        setTenure(Math.max(1, Math.round(tenure / 12)));
                      }
                      setTenureUnit('years');
                    }}
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                      tenureUnit === 'years' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Yr
                  </button>
                  <button
                    onClick={() => {
                      if (tenureUnit === 'years') {
                        setTenure(tenure * 12);
                      }
                      setTenureUnit('months');
                    }}
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                      tenureUnit === 'months' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max={tenureUnit === 'years' ? 30 : 360}
              step="1"
              value={tenure}
              onChange={(e) => setTenure(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>{tenureUnit === 'years' ? '1 Year' : '1 Month'}</span>
              <span>{tenureUnit === 'years' ? '30 Years' : '360 Months'}</span>
            </div>
          </div>
        </div>

        {/* Right: Calculations & Breakdown Card (6 cols) */}
        <div className="lg:col-span-6 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-indigo-300 font-bold">
                Computed Monthly EMI
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Standard Banking Formula
              </span>
            </div>

            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-emerald-400 mb-6">
              {formatCurrency(result.monthlyEMI, currency)}
              <span className="text-xs font-normal text-slate-400 ml-2">/ month</span>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Principal Amount</span>
                <span className="text-sm sm:text-base font-bold font-mono">
                  {formatCurrency(result.principalAmount, currency)}
                </span>
              </div>
              <div className="border-x border-white/10 px-3">
                <span className="text-[11px] text-slate-400 block mb-0.5">Total Interest</span>
                <span className="text-sm sm:text-base font-bold font-mono text-amber-400">
                  {formatCurrency(result.totalInterest, currency)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Total Repayment</span>
                <span className="text-sm sm:text-base font-bold font-mono text-sky-400">
                  {formatCurrency(result.totalRepayment, currency)}
                </span>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                  Principal: {(100 - result.interestRatio).toFixed(1)}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  Total Interest: {result.interestRatio}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
                <div
                  style={{ width: `${100 - result.interestRatio}%` }}
                  className="bg-sky-400 transition-all duration-300"
                />
                <div
                  style={{ width: `${result.interestRatio}%` }}
                  className="bg-amber-400 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-white/10 pt-4 mt-6">
            Formula: EMI = [P × r × (1+r)ⁿ] / [(1+r)ⁿ – 1], where r = Monthly Interest Rate.
          </div>
        </div>
      </div>

      {/* Amortization Schedule Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Repayment Schedule Breakdown
            </h4>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => setScheduleView('yearly')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                scheduleView === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Yearly View
            </button>
            <button
              onClick={() => setScheduleView('monthly')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                scheduleView === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly View ({result.schedule.length} Months)
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{scheduleView === 'yearly' ? 'Year' : 'Month'}</th>
                <th className="py-3 px-4">EMI Paid</th>
                <th className="py-3 px-4">Principal Component</th>
                <th className="py-3 px-4">Interest Component</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {scheduleView === 'yearly'
                ? yearlySchedule.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-indigo-600">Year {row.year}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {formatCurrency(row.emi, currency)}
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-medium">
                        {formatCurrency(row.principal, currency)}
                      </td>
                      <td className="py-3 px-4 text-amber-600 font-medium">
                        {formatCurrency(row.interest, currency)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrency(row.balance, currency)}
                      </td>
                    </tr>
                  ))
                : result.schedule.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-500">M-{row.month}</td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                        {formatCurrency(row.emi, currency)}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-600">
                        {formatCurrency(row.principal, currency)}
                      </td>
                      <td className="py-2.5 px-4 text-amber-600">
                        {formatCurrency(row.interest, currency)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrency(row.balance, currency)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
