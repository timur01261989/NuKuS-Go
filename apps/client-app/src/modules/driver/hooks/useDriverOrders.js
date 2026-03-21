import { useCallback, useEffect, useMemo, useState } from "react";
import {
  acceptDriverAssignment,
  fetchDriverAssignments,
  rejectDriverAssignment,
} from "../services/driverOrderService";

export function useDriverOrders(driverId, options = {}) {
  const limit = useMemo(() => {
    const parsed = Number(options.limit ?? 20);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
  }, [options.limit]);

  const [assignments, setAssignments] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [loading, setLoading] = useState(false);

  const reloadAssignments = useCallback(async () => {
    if (!driverId) {
      setAssignments([]);
      setActiveOrderId(null);
      return [];
    }

    setLoading(true);
    try {
      const data = await fetchDriverAssignments(driverId, limit);
      setAssignments(data);
      const active = data.find((item) => item?.status === "accepted" || item?.status === "in_progress");
      setActiveOrderId(active?.order_id ?? null);
      return data;
    } finally {
      setLoading(false);
    }
  }, [driverId, limit]);

  const acceptAssignment = useCallback(
    async (assignment) => {
      if (!assignment?.id || !assignment?.order_id || !driverId) return false;
      const ok = await acceptDriverAssignment(assignment.id, assignment.order_id, driverId);
      if (ok) {
        setActiveOrderId(assignment.order_id);
        await reloadAssignments();
      }
      return ok;
    },
    [driverId, reloadAssignments],
  );

  const rejectAssignment = useCallback(
    async (assignmentId) => {
      if (!assignmentId || !driverId) return false;
      const ok = await rejectDriverAssignment(assignmentId, driverId);
      if (ok) {
        await reloadAssignments();
      }
      return ok;
    },
    [driverId, reloadAssignments],
  );

  useEffect(() => {
    void reloadAssignments();
  }, [reloadAssignments]);

  return {
    assignments,
    activeOrderId,
    loading,
    reloadAssignments,
    acceptAssignment,
    rejectAssignment,
  };
}

export default useDriverOrders;
