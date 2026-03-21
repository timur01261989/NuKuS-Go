export type VerificationStatus = "pending" | "in_review" | "approved" | "rejected" | "expired";
export type DocumentType = "passport" | "driver_license" | "vehicle_registration" | "insurance" | "selfie";

export interface DriverDocument {
  id:           string;
  driver_id:    string;
  type:         DocumentType;
  file_url:     string;
  status:       VerificationStatus;
  rejection_reason?: string;
  expires_at?:  string;
  verified_at?: string;
  verified_by?: string;
  created_at:   string;
}

export interface DriverVerification {
  driver_id:    string;
  overall_status: VerificationStatus;
  documents:    Record<DocumentType, DriverDocument | null>;
  score:        number;          // 0-100
  background_check: "passed" | "failed" | "pending" | "not_started";
  vehicle_inspection: "passed" | "failed" | "pending";
  training_completed: boolean;
  last_updated: string;
}

export interface VehicleInspection {
  id:           string;
  driver_id:    string;
  vehicle_id:   string;
  status:       "passed" | "failed" | "pending";
  items: {
    brakes:    boolean;
    tires:     boolean;
    lights:    boolean;
    seatbelts: boolean;
    airbags:   boolean;
    ac:        boolean;
    cleanliness: boolean;
  };
  inspector_notes?: string;
  inspected_at:     string;
  expires_at:       string;
}
