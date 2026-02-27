import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import authMiddleware, { requireVerifiedDriver } from '../middleware/auth.js';

const router = express.Router();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Search intercity routes
 * GET /api/v1/intercity/search
 */
router.get('/search', asyncHandler(async (req, res) => {
  const {
    from_region_id,
    to_region_id,
    from_district_id,
    to_district_id,
    departure_date,
    seats_needed = 1
  } = req.query;
  
  let query = supabase
    .from('intercity_routes')
    .select(`
      *,
      driver:users!driver_id(id, full_name, phone, avatar_url, rating),
      from_region:regions!from_region_id(name_uz_latn, name_ru, name_en),
      to_region:regions!to_region_id(name_uz_latn, name_ru, name_en),
      from_district:districts!from_district_id(name_uz_latn, name_ru, name_en),
      to_district:districts!to_district_id(name_uz_latn, name_ru, name_en)
    `)
    .eq('status', 'active')
    .gte('available_seats', seats_needed);
  
  if (from_region_id) {
    query = query.eq('from_region_id', from_region_id);
  }
  
  if (to_region_id) {
    query = query.eq('to_region_id', to_region_id);
  }
  
  if (from_district_id) {
    query = query.eq('from_district_id', from_district_id);
  }
  
  if (to_district_id) {
    query = query.eq('to_district_id', to_district_id);
  }
  
  if (departure_date) {
    query = query.eq('departure_date', departure_date);
  }
  
  const { data, error } = await query.order('departure_date').order('departure_time');
  
  if (error) {
    throw new OperationalError(error.message, 500);
  }
  
  res.json({
    success: true,
    data
  });
}));

/**
 * Get route by ID
 * GET /api/v1/intercity/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from('intercity_routes')
    .select(`
      *,
      driver:users!driver_id(id, full_name, phone, avatar_url, rating, created_at),
      driver_profile:driver_profiles!driver_id(car_model, car_color, car_number, car_year),
      from_region:regions!from_region_id(*),
      to_region:regions!to_region_id(*),
      from_district:districts!from_district_id(*),
      to_district:districts!to_district_id(*),
      bookings:intercity_bookings(id, seats_booked, status, client:users!client_id(full_name, avatar_url))
    `)
    .eq('id', id)
    .single();
  
  if (error || !data) {
    throw new OperationalError('Route not found', 404);
  }
  
  res.json({
    success: true,
    data
  });
}));

/**
 * Create new route (Driver only)
 * POST /api/v1/intercity
 */
router.post('/', authMiddleware, requireVerifiedDriver, asyncHandler(async (req, res) => {
  const {
    from_region_id,
    from_district_id,
    to_region_id,
    to_district_id,
    departure_location,
    departure_address,
    arrival_location,
    arrival_address,
    departure_date,
    departure_time,
    total_seats,
    price_per_seat,
    full_car_price,
    pickup_from_home_price,
    delivery_to_home_price,
    car_features,
    car_class,
    notes
  } = req.body;
  
  // Validation
  if (!from_region_id || !to_region_id || !departure_date || !departure_time || !total_seats || !price_per_seat) {
    throw new OperationalError('Missing required fields', 400);
  }
  
  // Create route
  const { data, error } = await supabase
    .from('intercity_routes')
    .insert({
      driver_id: req.userId,
      from_region_id,
      from_district_id,
      to_region_id,
      to_district_id,
      departure_location,
      departure_address,
      arrival_location,
      arrival_address,
      departure_date,
      departure_time,
      total_seats,
      available_seats: total_seats,
      price_per_seat,
      full_car_price,
      pickup_from_home_price,
      delivery_to_home_price,
      car_features,
      car_class,
      notes,
      status: 'active'
    })
    .select()
    .single();
  
  if (error) {
    throw new OperationalError(error.message, 500);
  }
  
  res.status(201).json({
    success: true,
    data
  });
}));

/**
 * Update route (Driver only)
 * PUT /api/v1/intercity/:id
 */
router.put('/:id', authMiddleware, requireVerifiedDriver, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check ownership
  const { data: existingRoute } = await supabase
    .from('intercity_routes')
    .select('driver_id, status')
    .eq('id', id)
    .single();
  
  if (!existingRoute) {
    throw new OperationalError('Route not found', 404);
  }
  
  if (existingRoute.driver_id !== req.userId) {
    throw new OperationalError('Unauthorized', 403);
  }
  
  // Can only edit if status is active and no bookings confirmed
  const { data: confirmedBookings } = await supabase
    .from('intercity_bookings')
    .select('id')
    .eq('route_id', id)
    .eq('status', 'confirmed')
    .limit(1);
  
  if (confirmedBookings && confirmedBookings.length > 0) {
    throw new OperationalError('Cannot edit route with confirmed bookings', 400);
  }
  
  // Update
  const { data, error } = await supabase
    .from('intercity_routes')
    .update(req.body)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new OperationalError(error.message, 500);
  }
  
  res.json({
    success: true,
    data
  });
}));

/**
 * Delete route (Driver only)
 * DELETE /api/v1/intercity/:id
 */
router.delete('/:id', authMiddleware, requireVerifiedDriver, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check ownership
  const { data: existingRoute } = await supabase
    .from('intercity_routes')
    .select('driver_id')
    .eq('id', id)
    .single();
  
  if (!existingRoute) {
    throw new OperationalError('Route not found', 404);
  }
  
  if (existingRoute.driver_id !== req.userId) {
    throw new OperationalError('Unauthorized', 403);
  }
  
  // Check for confirmed bookings
  const { data: confirmedBookings } = await supabase
    .from('intercity_bookings')
    .select('id')
    .eq('route_id', id)
    .eq('status', 'confirmed')
    .limit(1);
  
  if (confirmedBookings && confirmedBookings.length > 0) {
    throw new OperationalError('Cannot delete route with confirmed bookings', 400);
  }
  
  // Delete
  const { error } = await supabase
    .from('intercity_routes')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new OperationalError(error.message, 500);
  }
  
  res.json({
    success: true,
    message: 'Route deleted successfully'
  });
}));

/**
 * Book a route (Client)
 * POST /api/v1/intercity/:id/book
 */
router.post('/:id/book', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    seats_booked,
    is_full_car,
    pickup_from_home,
    delivery_to_home,
    pickup_location,
    pickup_address,
    delivery_location,
    delivery_address,
    passenger_names,
    passenger_phones,
    notes
  } = req.body;
  
  // Validation
  if (!seats_booked || seats_booked < 1) {
    throw new OperationalError('Invalid number of seats', 400);
  }
  
  // Get route
  const { data: route, error: routeError } = await supabase
    .from('intercity_routes')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single();
  
  if (routeError || !route) {
    throw new OperationalError('Route not found or not available', 404);
  }
  
  // Check availability
  if (route.available_seats < seats_booked && !is_full_car) {
    throw new OperationalError('Not enough seats available', 400);
  }
  
  // Calculate price
  let total_price = is_full_car ? route.full_car_price : (route.price_per_seat * seats_booked);
  if (pickup_from_home) total_price += route.pickup_from_home_price || 0;
  if (delivery_to_home) total_price += route.delivery_to_home_price || 0;
  
  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('intercity_bookings')
    .insert({
      route_id: id,
      client_id: req.userId,
      seats_booked: is_full_car ? route.total_seats : seats_booked,
      is_full_car,
      pickup_from_home,
      delivery_to_home,
      pickup_location,
      pickup_address,
      delivery_location,
      delivery_address,
      total_price,
      passenger_names,
      passenger_phones,
      notes,
      status: 'pending',
      payment_status: 'pending'
    })
    .select()
    .single();
  
  if (bookingError) {
    throw new OperationalError(bookingError.message, 500);
  }
  
  // Update available seats
  await supabase
    .from('intercity_routes')
    .update({
      available_seats: is_full_car ? 0 : route.available_seats - seats_booked,
      status: is_full_car || route.available_seats - seats_booked === 0 ? 'full' : 'active'
    })
    .eq('id', id);
  
  res.status(201).json({
    success: true,
    data: booking
  });
}));

/**
 * Get my routes (Driver)
 * GET /api/v1/intercity/my/routes
 */
router.get('/my/routes', authMiddleware, requireVerifiedDriver, asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let query = supabase
    .from('intercity_routes')
    .select(`
      *,
      from_region:regions!from_region_id(name_uz_latn, name_ru, name_en),
      to_region:regions!to_region_id(name_uz_latn, name_ru, name_en),
      bookings:intercity_bookings(id, seats_booked, status, total_price)
    `)
    .eq('driver_id', req.userId);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('departure_date', { ascending: false });
  
  if (error) {
    throw new OperationalError(error.message, 500);
  }
  
  res.json({
    success: true,
    data
  });
}));

/**
 * Get my bookings (Client)
 * GET /api/v1/intercity/my/bookings
 */
router.get('/my/bookings', authMiddleware, asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let query = supabase
    .from('intercity_bookings')
    .select(`
      *,
      route:intercity_routes(*,
        driver:users!driver_id(id, full_name, phone, avatar_url, rating)
      )
    `)
    .eq('client_id', req.userId);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new OperationalError(error.message, 500);
  }
  
  res.json({
    success: true,
    data
  });
}));

export default router;
