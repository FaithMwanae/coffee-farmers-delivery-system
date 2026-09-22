/**
 * Calculate payment for a farmer based on deliveries and transactions.
 */
export const calculatePayment = (farmer, farmerTransactions, settings) => {
  const rate = settings.ratePerKg || 80;
  const gross = farmer.totalDelivered * rate;

  const advances = farmerTransactions
    .filter((t) => t.type === 'Advance')
    .reduce((sum, t) => sum + t.amount, 0);

  const deductions = farmerTransactions
    .filter((t) => t.type === 'Deduction')
    .reduce((sum, t) => sum + t.amount, 0);

  const net = gross - advances - deductions;

  return {
    memberNo: farmer.memberNo,
    farmerName: farmer.name,
    totalWeight: farmer.totalDelivered,
    rate,
    gross,
    advances,
    deductions,
    net,
  };
};