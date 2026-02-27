import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';

const router = express.Router();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Register new user
 * POST /api/v1/auth/register
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { phone, password, fullName, role = 'client' } = req.body;
  
  if (!phone || !password) {
    throw new OperationalError('Phone and password are required', 400);
  }
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    phone: phone.startsWith('+') ? phone : `+998${phone}`,
    password,
    options: {
      data: {
        full_name: fullName,
        role
      }
    }
  });
  
  if (authError) {
    throw new OperationalError(authError.message, 400);
  }
  
  // Create user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      phone,
      full_name: fullName,
      role
    })
    .select()
    .single();
  
  if (userError) {
    throw new OperationalError(userError.message, 500);
  }
  
  // Create wallet for user
  await supabase
    .from('wallets')
    .insert({
      user_id: user.id,
      balance: 0
    });
  
  res.status(201).json({
    success: true,
    data: {
      user,
      session: authData.session
    }
  });
}));

/**
 * Login
 * POST /api/v1/auth/login
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    throw new OperationalError('Phone and password are required', 400);
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: phone.startsWith('+') ? phone : `+998${phone}`,
    password
  });
  
  if (error) {
    throw new OperationalError('Invalid credentials', 401);
  }
  
  // Get user details
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  res.json({
    success: true,
    data: {
      user,
      session: data.session
    }
  });
}));

/**
 * Verify OTP
 * POST /api/v1/auth/verify-otp
 */
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { phone, token } = req.body;
  
  if (!phone || !token) {
    throw new OperationalError('Phone and token are required', 400);
  }
  
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone.startsWith('+') ? phone : `+998${phone}`,
    token,
    type: 'sms'
  });
  
  if (error) {
    throw new OperationalError('Invalid OTP', 400);
  }
  
  res.json({
    success: true,
    data
  });
}));

/**
 * Logout
 * POST /api/v1/auth/logout
 */
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    await supabase.auth.signOut();
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * Refresh token
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    throw new OperationalError('Refresh token required', 400);
  }
  
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token
  });
  
  if (error) {
    throw new OperationalError('Invalid refresh token', 401);
  }
  
  res.json({
    success: true,
    data
  });
}));

export default router;
