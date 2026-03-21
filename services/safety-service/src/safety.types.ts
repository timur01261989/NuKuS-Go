export type AlertType = "sos" | "route_deviation" | "long_stop" | "speed_violation" | "panic_button";
export type AlertStatus = "active" | "resolved" | "false_alarm";

export interface SafetyAlert {
  id:           string;
  order_id:     string;
  user_id:      string;
  driver_id?:   string;
  type:         AlertType;
  status:       AlertStatus;
  lat:          number;
  lng:          number;
  description?: string;
  contacts_notified: string[];
  created_at:   string;
  resolved_at?: string;
}

export interface TrustedContact {
  id:           string;
  user_id:      string;
  name:         string;
  phone:        string;
  relation:     string;  // "ota", "ona", "er/xotin", "do'st"
  notify_on_sos:    boolean;
  notify_on_trip:   boolean;  // Share trip status
  created_at:   string;
}

export interface TripShare {
  id:           string;
  order_id:     string;
  user_id:      string;
  share_token:  string;
  expires_at:   string;
  views:        number;
}

export interface CheckIn {
  order_id:     string;
  driver_id:    string;
  lat:          number;
  lng:          number;
  speed_kmh:    number;
  ts:           string;
}
