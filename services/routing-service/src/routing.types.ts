export interface Waypoint {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export interface RouteStep {
  instruction:   string;
  distance_m:    number;
  duration_s:    number;
  bearing_after: number;
  maneuver:      "turn-left" | "turn-right" | "straight" | "arrive" | "depart" | "roundabout" | "merge";
  street_name?:  string;
  exit_number?:  number;
}

export interface Route {
  distance_m:    number;
  duration_s:    number;
  polyline:      string;           // Encoded polyline
  waypoints:     Waypoint[];
  steps:         RouteStep[];
  traffic_level: "free" | "slow" | "jam";
  via_roads:     string[];
  alternatives?: Omit<Route, "alternatives">[];
}

export interface TrafficData {
  segment_id:    string;
  from_lat:      number;
  from_lng:      number;
  to_lat:        number;
  to_lng:        number;
  speed_kmh:     number;
  congestion:    0 | 1 | 2 | 3;   // 0=free, 1=slow, 2=heavy, 3=standstill
  updated_at:    string;
}

export interface NavigationSession {
  session_id:    string;
  driver_id:     string;
  order_id:      string;
  route:         Route;
  current_step:  number;
  off_route:     boolean;
  started_at:    string;
}
