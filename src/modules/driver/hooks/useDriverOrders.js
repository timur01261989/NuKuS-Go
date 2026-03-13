import { useCallback, useEffect, useState } from "react";
import {
  acceptDriverAssignment,
  fetchDriverAssignments,
} from "../services/driverOrderService";

export function useDriverOrders(driverId) {
  const [assignments, setAssignments] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);

  const reloadAssignments = useCallback(async () => {
    if (!driverId) return;
    const data = await fetchDriverAssignments(driverId, 20);
    setAssignments(data);
  }, [driverId]);

  const acceptAssignment = useCallback(
    async (assignment) => {
      if (!assignment?.id || !assignment?.order_id || !driverId) return false;

      const ok = await acceptDriverAssignment(
        assignment.id,
        assignment.order_id,
        driverId
      );

      if (ok) {
        setActiveOrderId(assignment.order_id);
      }

      await reloadAssignments();
      return ok;
    },
    [driverId, reloadAssignments]
  );

  useEffect(() => {
    reloadAssignments();
  }, [reloadAssignments]);

  return {
    assignments,
    activeOrderId,
    reloadAssignments,
    acceptAssignment,
  };
}
