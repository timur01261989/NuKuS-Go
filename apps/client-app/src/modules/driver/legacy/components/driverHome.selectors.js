export function resolveVisibleServices(canUseService) {
  return {
    taxi: !!canUseService?.("taxi"),
    interProv: !!canUseService?.("interProv"),
    interDist: !!canUseService?.("interDist"),
    freight: !!canUseService?.("freight"),
    delivery: !!canUseService?.("delivery"),
  };
}

export function resolveServiceAvailability(visibleServices, fallbackVisibleServices = {}) {
  const hasVisibleServices = Object.values(visibleServices || {}).some(Boolean);
  return hasVisibleServices ? visibleServices : fallbackVisibleServices;
}

export function buildDriverStatusText({ isOnline, activeService, getServiceLabel, tr }) {
  if (!isOnline) {
    return tr("offline", "oflayn");
  }
  const serviceSuffix = activeService ? ` (${getServiceLabel(activeService)})` : "";
  return `${tr("online", "onlayn")}${serviceSuffix}`;
}

export function buildActiveVehicleSummary(activeVehicle) {
  if (!activeVehicle) return "Sozlamalarda aktiv mashina tanlanmagan";
  return `${activeVehicle.brand || ""} ${activeVehicle.model || ""} · ${activeVehicle.plateNumber || "raqamsiz"}`
    .replace(/\s+/g, " ")
    .trim();
}

export function buildDriverServiceCards({ tr, resolvedVisibleServices }) {
  const cards = [
    {
      key: "taxi",
      visible: !!resolvedVisibleServices?.taxi,
      title: tr("taxi", "Shahar ichida taksi"),
      hint: tr("cityTaxiHint", "Eng tezkor va qulay narxlar"),
      icon: "local_taxi",
      iconClassName: "bg-orange-100 text-primarySidebar",
      titleClassName: "text-2xl",
      buttonClassName: "border-primarySidebar/20",
      arrowClassName: "bg-primarySidebar text-white",
    },
    {
      key: "interProv",
      visible: !!resolvedVisibleServices?.interProv,
      title: tr("intercityLabel", "Viloyatlararo"),
      hint: tr("intercityHint", "Shaharlar va viloyatlar orasidagi qatnov"),
      icon: "travel",
      iconClassName: "bg-blue-100 text-blue-600",
      titleClassName: "text-xl",
      buttonClassName: "border-blue-200/70",
      arrowClassName: "bg-blue-600 text-white",
    },
    {
      key: "interDist",
      visible: !!resolvedVisibleServices?.interDist,
      title: tr("interdistrictLabel", "Tumanlararo"),
      hint: tr("interdistrictHint", "Yaqin hududlar bo‘ylab qatnov"),
      icon: "route",
      iconClassName: "bg-emerald-100 text-emerald-600",
      titleClassName: "text-xl",
      buttonClassName: "border-emerald-200/70",
      arrowClassName: "bg-emerald-600 text-white",
    },
    {
      key: "delivery",
      visible: !!resolvedVisibleServices?.delivery,
      title: tr("delivery", "Yetkazib berish"),
      hint: tr("deliveryDriverHint", "Shahar bo‘ylab tezkor yetkazma"),
      icon: "inventory_2",
      iconClassName: "bg-purple-100 text-purple-600",
      titleClassName: "text-lg",
      buttonClassName: "border-purple-200/70",
      arrowClassName: "bg-purple-600 text-white",
    },
    {
      key: "freight",
      visible: !!resolvedVisibleServices?.freight,
      title: tr("freight", "Yuk tashish"),
      hint: tr("freightDriverHint", "Katta yuklar va maxsus tashishlar"),
      icon: "local_shipping",
      iconClassName: "bg-amber-100 text-amber-700",
      titleClassName: "text-lg",
      buttonClassName: "border-amber-200/70",
      arrowClassName: "bg-amber-600 text-white",
    },
  ];
  return cards.filter((card) => card.visible);
}
