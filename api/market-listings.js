import { json, badRequest, serverError, uid, nowIso, isPhone, clampInt, store } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    // --- Supabase mode (production) ---
    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();

      if (req.method === 'GET') {
        const limit = clampInt(req.query?.limit, 1, 100, 50);
        const sort = String(req.query?.sort || 'newest');

        let q = sb.from('market_listings')
          .select('id,title,price_uzs,year,mileage_km,fuel,gearbox,city,phone,description,state,created_at,market_listing_images(url,sort)')
          .limit(limit);

        if (sort === 'price_asc') q = q.order('price_uzs', { ascending: true });
        else if (sort === 'price_desc') q = q.order('price_uzs', { ascending: false });
        else q = q.order('created_at', { ascending: false });

        const { data, error } = await q;
        if (error) throw error;

        const items = (data || []).map((r) => ({
          id: r.id,
          title: r.title,
          price_uzs: Number(r.price_uzs || 0),
          year: r.year,
          mileage_km: r.mileage_km,
          fuel: r.fuel,
          gearbox: r.gearbox,
          city: r.city,
          phone: r.phone,
          desc: r.description,
          state: r.state,
          created_at: r.created_at,
          image: (r.market_listing_images || []).sort((a,b)=>(a.sort||0)-(b.sort||0))[0]?.url || '/market/sample/cobalt.svg',
          images: (r.market_listing_images || []).sort((a,b)=>(a.sort||0)-(b.sort||0)).map(x=>x.url),
          source: 'supabase'
        }));

        return json(res, 200, { ok: true, items });
      }

      if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

        const title = String(body.title || '').trim();
        const price_uzs = Number(body.price_uzs || 0);
        const phone = String(body.phone || '').trim();

        if (!title) return badRequest(res, 'Sarlavha (title) kerak', { field:'title' });
        if (price_uzs <= 0) return badRequest(res, 'Narx noto‘g‘ri', { field:'price_uzs' });
        if (phone && !isPhone(phone)) return badRequest(res, 'Telefon noto‘g‘ri', { field:'phone' });

        const { data: ins, error: insErr } = await sb.from('market_listings').insert([{
          title,
          price_uzs,
          year: Number(body.year || 0) || null,
          mileage_km: Number(body.mileage_km || 0) || null,
          fuel: String(body.fuel || ''),
          gearbox: String(body.gearbox || ''),
          city: String(body.city || ''),
          phone,
          description: String(body.desc || ''),
          state: 'pending'
        }]).select('id,created_at').single();

        if (insErr) throw insErr;

        const images = Array.isArray(body.images) ? body.images : [];
        const cover = String(body.image || images[0] || '');
        const urls = [cover, ...images.filter(x => x && x !== cover)].filter(Boolean).slice(0, 10);

        if (urls.length) {
          const rows = urls.map((url, i) => ({ listing_id: ins.id, url, sort: i }));
          const { error: imgErr } = await sb.from('market_listing_images').insert(rows);
          if (imgErr) throw imgErr;
        }

        return json(res, 201, { ok:true, item: { id: ins.id, created_at: ins.created_at } });
      }

      return json(res, 405, { ok:false, error:'Method not allowed' });
    }

    // --- Demo mode (no Supabase) ---
    const db = store();

    if (req.method === 'GET') {
      const limit = clampInt(req.query?.limit, 1, 100, 50);
      const sort = String(req.query?.sort || 'newest');
      let items = [...db.listings];
      if (sort === 'price_asc') items.sort((a,b)=>(a.price_uzs||0)-(b.price_uzs||0));
      else if (sort === 'price_desc') items.sort((a,b)=>(b.price_uzs||0)-(a.price_uzs||0));
      else items.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
      return json(res, 200, { ok:true, items: items.slice(0, limit) });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const title = String(body.title || '').trim();
      const price_uzs = Number(body.price_uzs || 0);
      const phone = String(body.phone || '').trim();
      if (!title) return badRequest(res, 'Sarlavha (title) kerak', { field:'title' });
      if (price_uzs <= 0) return badRequest(res, 'Narx noto‘g‘ri', { field:'price_uzs' });
      if (phone && !isPhone(phone)) return badRequest(res, 'Telefon noto‘g‘ri', { field:'phone' });

      const item = {
        id: uid('car'),
        title,
        price_uzs,
        year: Number(body.year || 0),
        mileage_km: Number(body.mileage_km || 0),
        fuel: String(body.fuel || ''),
        gearbox: String(body.gearbox || ''),
        city: String(body.city || ''),
        phone,
        desc: String(body.desc || ''),
        image: String(body.image || ''),
        images: Array.isArray(body.images) ? body.images : [],
        state: 'pending',
        created_at: nowIso(),
        source: 'api_memory',
      };
      db.listings.unshift(item);
      return json(res, 201, { ok:true, item });
    }

    return json(res, 405, { ok:false, error:'Method not allowed' });
  } catch (e) {
    return serverError(res, e);
  }
}
