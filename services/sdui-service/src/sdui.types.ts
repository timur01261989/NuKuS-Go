export type ComponentType =
  | "banner" | "card" | "button" | "list" | "map_widget"
  | "surge_indicator" | "promo_banner" | "emergency_alert"
  | "feature_toggle" | "bottom_sheet" | "modal";

export interface SDUIComponent {
  id:          string;
  type:        ComponentType;
  visible:     boolean;
  priority:    number;           // Higher = shown first
  targeting:   TargetingRule;
  layout:      LayoutConfig;
  data:        Record<string, any>;
  actions:     SDUIAction[];
  expires_at?: string;
}

export interface TargetingRule {
  regions?:      string[];       // ["toshkent", "samarkand"]
  user_roles?:   string[];       // ["client", "driver", "premium"]
  app_versions?: string[];       // ["1.5.0+"]
  languages?:    string[];       // ["uz_latn", "ru"]
  conditions?:   string[];       // ["surge_active", "weekend"]
  user_ids?:     string[];       // Specific users (for testing)
}

export interface LayoutConfig {
  position: "top" | "bottom" | "modal" | "inline" | "overlay";
  theme:    "light" | "dark" | "warning" | "success" | "error";
  style:    Record<string, any>;
}

export interface SDUIAction {
  trigger: "tap" | "swipe" | "appear";
  type:    "navigate" | "api_call" | "dismiss" | "deeplink" | "share";
  payload: Record<string, any>;
}

export interface SDUIScreen {
  screen_id: string;
  version:   number;
  components: SDUIComponent[];
  refresh_after_ms: number;     // Client poll interval
  cached_for_ms:    number;     // Client cache TTL
}
