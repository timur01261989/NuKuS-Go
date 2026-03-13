import { supabase } from "@/services/supabase/supabaseClient";

const DRIVER_ASSIGNMENT_COLUMNS = [
  "id",
  "order_id",
  "driver_id",
  "status",
  "service_type",
  "pickup_lat",
  "pickup_lng",
  "dropoff_lat",
  "dropoff_lng",
  "created_at",
  "accepted_at",
].join(",");

export async function fetchDriverAssignments(driverId, limit = 20) {
  if (!driverId) return [];

  const { data, error } = await supabase
    .from("dispatch_assignments")
    .select(DRIVER_ASSIGNMENT_COLUMNS)
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchDriverAssignments error", error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

export async function acceptDriverAssignment(assignmentId, orderId, driverId) {
  if (!assignmentId || !orderId || !driverId) return false;

  const { data, error } = await supabase.rpc("accept_order_atomic", {
    p_order_id: orderId,
    p_driver_id: driverId,
  });

  if (error) {
    console.error("acceptDriverAssignment error", error);
    return false;
  }

  if (data === true) {
    const { error: updateError } = await supabase
      .from("dispatch_assignments")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", assignmentId)
      .eq("driver_id", driverId);

    if (updateError) {
      console.error("acceptDriverAssignment status update error", updateError);
    }
  }

  return data === true;
}

export async function rejectDriverAssignment(assignmentId, driverId) {
  if (!assignmentId || !driverId) return false;

  const { error } = await supabase
    .from("dispatch_assignments")
    .update({ status: "rejected" })
    .eq("id", assignmentId)
    .eq("driver_id", driverId);

  if (error) {
    console.error("rejectDriverAssignment error", error);
    return false;
  }

  return true;
}

export default {
  fetchDriverAssignments,
  acceptDriverAssignment,
  rejectDriverAssignment,
};
