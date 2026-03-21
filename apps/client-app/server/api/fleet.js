import { withAuth } from "../_shared/withAuth.js";
import { getServiceSupabase } from "../_shared/supabase.js";
import { attachDriverToFleet, getFleetDrivers } from "../_shared/fleet/fleetService.js";

async function handler(req, res) {
  const supabase = getServiceSupabase();

  if (req.method === "GET") {
    const fleetOwnerId = req.query?.fleet_owner_id;
    const rows = await getFleetDrivers({ supabase, fleetOwnerId });
    res.status(200).json({ rows });
    return;
  }

  if (req.method === "POST") {
    const { fleet_owner_id, driver_id } = req.body || {};
    const row = await attachDriverToFleet({
      supabase,
      fleetOwnerId: fleet_owner_id,
      driverId: driver_id,
    });
    res.status(200).json({ row });
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}

export default withAuth(handler);
