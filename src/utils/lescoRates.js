// LESCO Residential Unit Rates (Domestic / Home)
export const LESCO_RATES = [
  { minUnits: 1, maxUnits: 100, rate: 12.21, tier: 1 },
  { minUnits: 101, maxUnits: 200, rate: 14.53, tier: 2 },
  { minUnits: 201, maxUnits: 300, rate: 31.51, tier: 3 },
  { minUnits: 301, maxUnits: 400, rate: 38.41, tier: 4 },
  { minUnits: 401, maxUnits: 500, rate: 41.62, tier: 5 },
  { minUnits: 501, maxUnits: 600, rate: 43.04, tier: 6 },
  { minUnits: 601, maxUnits: 700, rate: 44.18, tier: 7 },
  { minUnits: 701, maxUnits: Infinity, rate: 49.10, tier: 8 },
];

// Calculate cost based on LESCO rates
export const calculateLESCOCost = (units) => {
  if (units <= 0) return { totalCost: 0, breakdown: [] };

  let totalCost = 0;
  let remainingUnits = units;
  const breakdown = [];

  for (const tier of LESCO_RATES) {
    if (remainingUnits <= 0) break;

    const unitsInTier = Math.min(remainingUnits, tier.maxUnits - tier.minUnits + 1);
    const tierCost = unitsInTier * tier.rate;
    
    breakdown.push({
      tier: tier.tier,
      minUnits: tier.minUnits,
      maxUnits: tier.maxUnits === Infinity ? 'Above' : tier.maxUnits,
      units: unitsInTier,
      rate: tier.rate,
      cost: tierCost,
    });

    totalCost += tierCost;
    remainingUnits -= unitsInTier;
  }

  return { totalCost, breakdown };
};

// Get tier information for a given unit consumption
export const getTierInfo = (units) => {
  const tier = LESCO_RATES.find(t => units >= t.minUnits && units <= t.maxUnits);
  return tier || LESCO_RATES[LESCO_RATES.length - 1];
};

// Calculate monthly cost estimate
export const calculateMonthlyEstimate = (dailyUsage) => {
  return dailyUsage * 30;
};

// Calculate yearly cost estimate
export const calculateYearlyEstimate = (dailyUsage) => {
  return dailyUsage * 365;
};

// Format currency for display
export const formatCurrency = (amount) => {
  return `PKR ${amount.toFixed(2)}`;
};

// Get cost savings tips based on usage
export const getCostSavingsTips = (units) => {
  const tips = [];
  
  if (units > 300) {
    tips.push({
      icon: 'lightbulb-on',
      title: 'High Usage Alert',
      message: 'You\'re in the highest tier. Consider reducing usage to save money.',
      priority: 'high'
    });
  }
  
  if (units > 200) {
    tips.push({
      icon: 'timer-outline',
      title: 'Peak Hours',
      message: 'Avoid using heavy appliances during peak hours (6-10 PM).',
      priority: 'medium'
    });
  }
  
  if (units > 100) {
    tips.push({
      icon: 'power-socket',
      title: 'Energy Efficiency',
      message: 'Switch to LED bulbs and energy-efficient appliances.',
      priority: 'low'
    });
  }
  
  return tips;
};
