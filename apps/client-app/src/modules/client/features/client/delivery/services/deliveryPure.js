export function calcDeliveryCommission(price) {
  return Math.round(Number(price || 0) * 0.1);
}

export function getStandardPointLabel(region, district) {
  const regionName = region || "Hudud";
  const districtName = district || "markazi";
  return `${regionName} / ${districtName} markaziy bekati`;
}
