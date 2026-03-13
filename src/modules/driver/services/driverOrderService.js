import { supabase } from "../../../services/supabase/supabaseClient";

export async function fetchDriverAssignments(driverId, limit = 20) {
  const { data, error } = await supabase
    .from("dispatch_assignments")
    .select("*")
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
  const { data, error } = await supabase.rpc("accept_order_atomic", {
    p_order_id: orderId,
    p_driver_id: driverId,
  });

  if (error) {
    console.error("acceptDriverAssignment error", error);
    return false;
  }

  if (data === true) {
    await supabase
      .from("dispatch_assignments")
      .update({ status: "accepted" })
      .eq("id", assignmentId)
      .eq("driver_id", driverId)
      .catch?.(() => null);
  }

  return data === true;
}
