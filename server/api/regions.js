import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get all regions
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('name_uz_latn');

  if (error) throw error;

  res.json({
    success: true,
    data
  });
}));

// Get districts by region
router.get('/:regionId/districts', asyncHandler(async (req, res) => {
  const { regionId } = req.params;

  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .eq('region_id', regionId)
    .order('name_uz_latn');

  if (error) throw error;

  res.json({
    success: true,
    data
  });
}));

export default router;
