import { createClient } from "@supabase/supabase-js";
import { DriverDocument, DriverVerification, DocumentType, VehicleInspection } from "./verification.types";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const REQUIRED_DOCS: DocumentType[] = ["passport", "driver_license", "vehicle_registration", "insurance", "selfie"];

export class VerificationService {

  async submitDocument(
    driverId: string,
    type:     DocumentType,
    fileUrl:  string,
    expiresAt?: string
  ): Promise<DriverDocument> {
    // Check if already exists
    await sb.from("driver_documents").update({ status: "pending" })
      .eq("driver_id", driverId).eq("type", type);

    const { data, error } = await sb.from("driver_documents").insert({
      id: uuid(), driver_id: driverId, type, file_url: fileUrl,
      status: "pending", expires_at: expiresAt,
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data as DriverDocument;
  }

  async getVerificationStatus(driverId: string): Promise<DriverVerification> {
    const { data: docs } = await sb.from("driver_documents")
      .select("*").eq("driver_id", driverId)
      .order("created_at", { ascending: false });

    const docMap: Record<string, DriverDocument | null> = {};
    for (const type of REQUIRED_DOCS) {
      const found = (docs || []).find((d: any) => d.type === type && d.status !== "rejected");
      docMap[type] = found || null;
    }

    const approvedCount = Object.values(docMap).filter(d => d?.status === "approved").length;
    const score = Math.round((approvedCount / REQUIRED_DOCS.length) * 100);

    const allApproved = REQUIRED_DOCS.every(t => docMap[t]?.status === "approved");
    const anyPending  = REQUIRED_DOCS.some(t => docMap[t]?.status === "pending" || docMap[t]?.status === "in_review");

    let overallStatus: DriverVerification["overall_status"] = "pending";
    if (allApproved) overallStatus = "approved";
    else if (anyPending) overallStatus = "in_review";
    else if (score === 0) overallStatus = "pending";

    return {
      driver_id:           driverId,
      overall_status:      overallStatus,
      documents:           docMap as Record<DocumentType, DriverDocument | null>,
      score,
      background_check:    allApproved ? "passed" : "pending",
      vehicle_inspection:  "pending",
      training_completed:  score >= 80,
      last_updated:        new Date().toISOString(),
    };
  }

  async reviewDocument(
    docId:    string,
    status:   "approved" | "rejected",
    reviewerId: string,
    reason?:  string
  ): Promise<DriverDocument> {
    const { data, error } = await sb.from("driver_documents").update({
      status,
      rejection_reason: status === "rejected" ? reason : null,
      verified_at:      status === "approved" ? new Date().toISOString() : null,
      verified_by:      reviewerId,
    }).eq("id", docId).select().single();
    if (error) throw error;
    return data as DriverDocument;
  }

  async submitVehicleInspection(
    driverId:  string,
    vehicleId: string,
    items:     VehicleInspection["items"],
    notes?:    string
  ): Promise<VehicleInspection> {
    const passed = Object.values(items).every(Boolean);
    const expiresAt = new Date(Date.now() + 180 * 86400000).toISOString(); // 6 months

    const { data, error } = await sb.from("vehicle_inspections").insert({
      id: uuid(), driver_id: driverId, vehicle_id: vehicleId,
      status: passed ? "passed" : "failed",
      items, inspector_notes: notes,
      inspected_at: new Date().toISOString(), expires_at: expiresAt,
    }).select().single();
    if (error) throw error;
    return data as VehicleInspection;
  }

  async getPendingReviews(limit = 20): Promise<DriverDocument[]> {
    const { data } = await sb.from("driver_documents")
      .select("*").eq("status", "pending")
      .order("created_at").limit(limit);
    return (data || []) as DriverDocument[];
  }

  async blockDriver(driverId: string, reason: string): Promise<void> {
    await sb.from("profiles").update({ role: "suspended" }).eq("id", driverId);
    await sb.from("driver_blocks").insert({
      driver_id: driverId, reason, blocked_at: new Date().toISOString(),
    });
  }
}
