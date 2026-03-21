import { Router } from "express";
import { searchPlaces, autocomplete } from "./indices/places.index";
import { searchCars } from "./indices/cars.index";
import { suggest } from "./suggest.service";

export const searchRouter = Router();

searchRouter.get("/places", async (req, res) => {
  try {
    const { q = "", city, lat, lng, limit = "10" } = req.query as Record<string, string>;
    const results = await searchPlaces(q, city, lat ? +lat : undefined, lng ? +lng : undefined, +limit);
    res.json({ results });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

searchRouter.get("/places/autocomplete", async (req, res) => {
  try {
    const { q = "", city } = req.query as Record<string, string>;
    res.json({ suggestions: await autocomplete(q, city) });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

searchRouter.get("/cars", async (req, res) => {
  try {
    const { limit = "20", offset = "0", ...filters } = req.query as Record<string, any>;
    res.json(await searchCars(filters, +limit, +offset));
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

searchRouter.get("/suggest", async (req, res) => {
  try {
    const { q = "", type = "places" } = req.query as Record<string, string>;
    res.json({ suggestions: await suggest(q, type as any) });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});
