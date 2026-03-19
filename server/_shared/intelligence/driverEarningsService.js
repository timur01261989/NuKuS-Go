
export function calculateDriverEarnings(fare){
  const commission = fare*0.15
  return {
    driver_income: fare-commission,
    platform_fee: commission
  }
}
