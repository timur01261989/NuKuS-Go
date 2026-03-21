import { withAuth } from "../_shared/withAuth.js";
import { getServiceSupabase } from "../_shared/supabase.js";
import { registerPartner, issuePartnerApiKey } from "../_shared/partners/partnerService.js";

async function handler(req, res) {
  const supabase = getServiceSupabase();

  if (req.method === "POST") {
    const { action } = req.body || {};

    if (action === "register") {
      const row = await registerPartner({
        supabase,
        partnerType: req.body.partner_type,
        companyName: req.body.company_name,
      });
      res.status(200).json({ row });
      return;
    }

    if (action === "issue_key") {
      const row = await issuePartnerApiKey({
        supabase,
        partnerId: req.body.partner_id,
        apiKey: req.body.api_key,
      });
      res.status(200).json({ row });
      return;
    }
  }

  res.status(405).json({ error: "method_not_allowed" });
}

export default withAuth(handler);
