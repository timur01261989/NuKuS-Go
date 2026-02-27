import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Fetch user details from database
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request
    req.user = userDetails;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

/**
 * Driver verification middleware
 */
export async function requireVerifiedDriver(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Driver access required'
      });
    }

    const { data: profile, error } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', 'approved')
      .single();

    if (error || !profile) {
      return res.status(403).json({
        success: false,
        message: 'Driver profile not verified'
      });
    }

    req.driverProfile = profile;
    next();
  } catch (error) {
    console.error('Driver verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
}

export default authMiddleware;
