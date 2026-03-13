export async function registerPartner({ supabase, partnerType, companyName }) {
  const { data, error } = await supabase
    .from("partners")
    .insert({
      partner_type: partnerType,
      company_name: companyName,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function issuePartnerApiKey({ supabase, partnerId, apiKey }) {
  const { data, error } = await supabase
    .from("partner_api_keys")
    .insert({
      partner_id: partnerId,
      api_key: apiKey,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
