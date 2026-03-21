export function calculateInstallmentPlan(input = {}) {
  const vehiclePrice = Number(input.vehiclePrice || 0);
  const initialPayment = Number(input.initialPayment || vehiclePrice * 0.25);
  const annualRatePercent = Number(input.annualRatePercent || 26);
  const months = Number(input.months || 36);

  const financedAmount = Math.max(vehiclePrice - initialPayment, 0);
  const monthlyRate = annualRatePercent / 100 / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? financedAmount / Math.max(months, 1)
      : (financedAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  return {
    financedAmount: Math.round(financedAmount),
    monthlyPayment: Math.round(monthlyPayment || 0),
    totalPayment: Math.round((monthlyPayment || 0) * months + initialPayment),
  };
}

export function buildFinanceHighlights(car = {}) {
  const plan = calculateInstallmentPlan({ vehiclePrice: car?.price || 0 });
  return [
    { key: "first", label: "Boshlang‘ich to‘lov", value: plan.financedAmount ? `${Number(car?.price * 0.25 || 0).toLocaleString("uz-UZ")} so‘m` : "—" },
    { key: "month", label: "Oyiga taxminan", value: `${plan.monthlyPayment.toLocaleString("uz-UZ")} so‘m` },
    { key: "term", label: "Muddat", value: "36 oy" },
  ];
}