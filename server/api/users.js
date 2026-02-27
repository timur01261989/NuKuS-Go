import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get current user
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
}));

// Update user profile
router.put('/me', authMiddleware, asyncHandler(async (req, res) => {
  const updates = req.body;
  delete updates.id;
  delete updates.role;
  delete updates.created_at;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.userId)
    .select()
    .single();

  if (error) throw new OperationalError(error.message, 500);

  res.json({
    success: true,
    data
  });
}));

export default router;
