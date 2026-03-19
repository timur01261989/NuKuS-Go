export async function attachDriverToFleet({ supabase, fleetOwnerId, driverId }) {
  const { data, error } = await supabase
    .from("fleet_drivers")
    .insert({
      fleet_owner_id: fleetOwnerId,
      driver_id: driverId,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getFleetDrivers({ supabase, fleetOwnerId }) {
  const { data, error } = await supabase
    .from("fleet_drivers")
    .select("*")
    .eq("fleet_owner_id", fleetOwnerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
