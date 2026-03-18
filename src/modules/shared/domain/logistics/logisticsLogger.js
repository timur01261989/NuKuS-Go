
function print(level, scope, action, details = {}) {
  const payload = {
    scope,
    action,
    ...details,
  };
  const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  writer(`[logistics:${scope}:${action}]`, payload);
}

export const logisticsLogger = {
  info(scope, action, details) {
    print("info", scope, action, details);
  },
  warn(scope, action, details) {
    print("warn", scope, action, details);
  },
  error(scope, action, details) {
    print("error", scope, action, details);
  },
};
