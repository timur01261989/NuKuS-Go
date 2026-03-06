
export function canActivateService(currentService, targetService) {
  if (!currentService) return true;
  return currentService === targetService;
}
