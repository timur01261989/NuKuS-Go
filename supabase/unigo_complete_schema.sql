-- ============================================
-- UNIGO - COMPLETE DATABASE SCHEMA
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(20) CHECK (role IN ('client', 'driver', 'admin')) DEFAULT 'client',
    avatar_url TEXT,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_rides INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver profiles
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE,
    license_expiry DATE,
    car_model VARCHAR(100),
    car_color VARCHAR(50),
    car_number VARCHAR(20) UNIQUE,
    car_year INTEGER,
    car_photos TEXT[],
    technical_passport TEXT,
    insurance_policy TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending',
    services_enabled TEXT[] DEFAULT ARRAY['city_taxi'],
    is_online BOOLEAN DEFAULT false,
    current_location GEOGRAPHY(POINT),
    verification_documents JSONB,
    admin_notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- 2. LOCATIONS & GEOGRAPHY
-- ============================================

-- Regions (Viloyatlar)
CREATE TABLE IF NOT EXISTS public.regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_uz_latn VARCHAR(100) NOT NULL,
    name_uz_cyrl VARCHAR(100),
    name_kaa_latn VARCHAR(100),
    name_kaa_cyrl VARCHAR(100),
    name_ru VARCHAR(100),
    name_en VARCHAR(100),
    code VARCHAR(10) UNIQUE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('region', 'republic', 'city')),
    center_location GEOGRAPHY(POINT),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Districts (Tumanlar)
CREATE TABLE IF NOT EXISTS public.districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
    name_uz_latn VARCHAR(100) NOT NULL,
    name_uz_cyrl VARCHAR(100),
    name_kaa_latn VARCHAR(100),
    name_kaa_cyrl VARCHAR(100),
    name_ru VARCHAR(100),
    name_en VARCHAR(100),
    code VARCHAR(10) UNIQUE NOT NULL,
    center_location GEOGRAPHY(POINT),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved addresses
CREATE TABLE IF NOT EXISTS public.saved_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('home', 'work', 'other')),
    name VARCHAR(100),
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT) NOT NULL,
    district_id UUID REFERENCES public.districts(id),
    region_id UUID REFERENCES public.regions(id),
    entrance VARCHAR(20),
    floor VARCHAR(20),
    apartment VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. RIDES & ORDERS
-- ============================================

-- City taxi orders (Shahar ichida)
CREATE TABLE IF NOT EXISTS public.city_taxi_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id),
    pickup_location GEOGRAPHY(POINT) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_location GEOGRAPHY(POINT) NOT NULL,
    dropoff_address TEXT NOT NULL,
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    price DECIMAL(10,2),
    tariff_type VARCHAR(20) CHECK (tariff_type IN ('economy', 'comfort', 'business', 'courier')),
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'wallet')),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by VARCHAR(10) CHECK (cancelled_by IN ('client', 'driver', 'system')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Intercity routes (Viloyatlar aro)
CREATE TABLE IF NOT EXISTS public.intercity_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    from_region_id UUID REFERENCES public.regions(id),
    from_district_id UUID REFERENCES public.districts(id),
    to_region_id UUID REFERENCES public.regions(id),
    to_district_id UUID REFERENCES public.districts(id),
    departure_location GEOGRAPHY(POINT) NOT NULL,
    departure_address TEXT NOT NULL,
    arrival_location GEOGRAPHY(POINT),
    arrival_address TEXT,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price_per_seat DECIMAL(10,2) NOT NULL,
    full_car_price DECIMAL(10,2),
    pickup_from_home_price DECIMAL(10,2),
    delivery_to_home_price DECIMAL(10,2),
    car_features TEXT[], -- ['conditioner', 'wifi', 'charger', 'luggage']
    car_class VARCHAR(20) CHECK (car_class IN ('economy', 'comfort', 'business', 'luxury')),
    smoking_allowed BOOLEAN DEFAULT false,
    pets_allowed BOOLEAN DEFAULT false,
    luggage_space BOOLEAN DEFAULT true,
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'full', 'in_progress', 'completed', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intercity bookings
CREATE TABLE IF NOT EXISTS public.intercity_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES public.intercity_routes(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    seats_booked INTEGER NOT NULL,
    is_full_car BOOLEAN DEFAULT false,
    pickup_from_home BOOLEAN DEFAULT false,
    delivery_to_home BOOLEAN DEFAULT false,
    pickup_location GEOGRAPHY(POINT),
    pickup_address TEXT,
    delivery_location GEOGRAPHY(POINT),
    delivery_address TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'wallet')),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    passenger_names TEXT[],
    passenger_phones TEXT[],
    notes TEXT,
    cancellation_reason TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- District routes (Tumanlar aro)
CREATE TABLE IF NOT EXISTS public.district_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    region_id UUID REFERENCES public.regions(id) NOT NULL,
    from_district_id UUID REFERENCES public.districts(id) NOT NULL,
    to_district_id UUID REFERENCES public.districts(id),
    route_type VARCHAR(20) CHECK (route_type IN ('fixed', 'flexible')) DEFAULT 'fixed',
    -- Fixed route: from station to station
    -- Flexible route: custom pickup/dropoff
    departure_location GEOGRAPHY(POINT) NOT NULL,
    departure_address TEXT NOT NULL,
    arrival_location GEOGRAPHY(POINT),
    arrival_address TEXT,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price_per_seat DECIMAL(10,2) NOT NULL,
    full_car_price DECIMAL(10,2),
    pickup_from_home_price DECIMAL(10,2),
    delivery_to_home_price DECIMAL(10,2),
    car_features TEXT[],
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'full', 'in_progress', 'completed', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- District bookings
CREATE TABLE IF NOT EXISTS public.district_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES public.district_routes(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    seats_booked INTEGER NOT NULL,
    is_full_car BOOLEAN DEFAULT false,
    pickup_from_home BOOLEAN DEFAULT false,
    delivery_to_home BOOLEAN DEFAULT false,
    pickup_location GEOGRAPHY(POINT),
    pickup_address TEXT,
    delivery_location GEOGRAPHY(POINT),
    delivery_address TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'wallet')),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    passenger_names TEXT[],
    passenger_phones TEXT[],
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Delivery orders (Yetkazib berish)
CREATE TABLE IF NOT EXISTS public.delivery_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.users(id),
    from_region_id UUID REFERENCES public.regions(id),
    from_district_id UUID REFERENCES public.districts(id),
    to_region_id UUID REFERENCES public.regions(id),
    to_district_id UUID REFERENCES public.districts(id),
    pickup_location GEOGRAPHY(POINT) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_location GEOGRAPHY(POINT) NOT NULL,
    dropoff_address TEXT NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    package_description TEXT,
    package_weight DECIMAL(10,2),
    package_size VARCHAR(20) CHECK (package_size IN ('small', 'medium', 'large')),
    price DECIMAL(10,2),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'wallet')),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
    receiver_name VARCHAR(255),
    receiver_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 4. PAYMENTS & WALLET
-- ============================================

-- Wallets
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'UZS',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'bonus', 'commission')),
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- 'city_taxi_order', 'intercity_booking', etc.
    reference_id UUID,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. AUTO MARKET
-- ============================================

-- Car listings
CREATE TABLE IF NOT EXISTS public.car_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    mileage INTEGER,
    price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    condition VARCHAR(20) CHECK (condition IN ('new', 'used', 'excellent', 'good', 'fair')),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('petrol', 'diesel', 'gas', 'electric', 'hybrid')),
    transmission VARCHAR(20) CHECK (transmission IN ('manual', 'automatic')),
    color VARCHAR(50),
    region_id UUID REFERENCES public.regions(id),
    district_id UUID REFERENCES public.districts(id),
    location GEOGRAPHY(POINT),
    photos TEXT[] NOT NULL,
    description TEXT,
    features TEXT[],
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'sold', 'suspended', 'pending')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sold_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 6. NOTIFICATIONS
-- ============================================

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title_uz VARCHAR(255),
    title_ru VARCHAR(255),
    title_en VARCHAR(255),
    message_uz TEXT,
    message_ru TEXT,
    message_en TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_role ON public.users(role);

-- Driver profiles indexes
CREATE INDEX idx_driver_profiles_user_id ON public.driver_profiles(user_id);
CREATE INDEX idx_driver_profiles_status ON public.driver_profiles(status);
CREATE INDEX idx_driver_profiles_location ON public.driver_profiles USING GIST(current_location);

-- Orders indexes
CREATE INDEX idx_city_taxi_client ON public.city_taxi_orders(client_id);
CREATE INDEX idx_city_taxi_driver ON public.city_taxi_orders(driver_id);
CREATE INDEX idx_city_taxi_status ON public.city_taxi_orders(status);
CREATE INDEX idx_city_taxi_created ON public.city_taxi_orders(created_at DESC);

-- Routes indexes
CREATE INDEX idx_intercity_routes_driver ON public.intercity_routes(driver_id);
CREATE INDEX idx_intercity_routes_date ON public.intercity_routes(departure_date);
CREATE INDEX idx_intercity_routes_status ON public.intercity_routes(status);
CREATE INDEX idx_intercity_routes_from_region ON public.intercity_routes(from_region_id);
CREATE INDEX idx_intercity_routes_to_region ON public.intercity_routes(to_region_id);

-- ============================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON public.driver_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_addresses_updated_at BEFORE UPDATE ON public.saved_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intercity_routes_updated_at BEFORE UPDATE ON public.intercity_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_district_routes_updated_at BEFORE UPDATE ON public.district_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_listings_updated_at BEFORE UPDATE ON public.car_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. SEED DATA - REGIONS AND DISTRICTS
-- ============================================

-- Insert regions
INSERT INTO public.regions (name_uz_latn, name_uz_cyrl, name_ru, name_en, code, type) VALUES
('Qoraqalpog''iston', 'Қорақалпоғистон', 'Каракалпакстан', 'Karakalpakstan', 'QR', 'republic'),
('Andijon', 'Андижон', 'Андижан', 'Andijan', 'AN', 'region'),
('Buxoro', 'Бухоро', 'Бухара', 'Bukhara', 'BU', 'region'),
('Farg''ona', 'Фарғона', 'Фергана', 'Fergana', 'FA', 'region'),
('Jizzax', 'Жиззах', 'Джизак', 'Jizzakh', 'JI', 'region'),
('Xorazm', 'Хоразм', 'Хорезм', 'Khorezm', 'XO', 'region'),
('Namangan', 'Наманган', 'Наманган', 'Namangan', 'NA', 'region'),
('Navoiy', 'Навоий', 'Навои', 'Navoi', 'NW', 'region'),
('Qashqadaryo', 'Қашқадарё', 'Кашкадарья', 'Kashkadarya', 'QA', 'region'),
('Samarqand', 'Самарқанд', 'Самарканд', 'Samarkand', 'SA', 'region'),
('Sirdaryo', 'Сирдарё', 'Сырдарья', 'Sirdarya', 'SI', 'region'),
('Surxondaryo', 'Сурхондарё', 'Сурхандарья', 'Surkhandarya', 'SU', 'region'),
('Toshkent viloyati', 'Тошкент вилояти', 'Ташкентская область', 'Tashkent Region', 'TO', 'region'),
('Toshkent shahri', 'Тошкент шаҳри', 'Город Ташкент', 'Tashkent City', 'TK', 'city')
ON CONFLICT (code) DO NOTHING;

-- Sample districts for Qoraqalpog'iston
INSERT INTO public.districts (region_id, name_uz_latn, name_uz_cyrl, name_ru, name_en, code) 
SELECT id, 'Nukus', 'Нукус', 'Нукус', 'Nukus', 'QR01' FROM public.regions WHERE code = 'QR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.districts (region_id, name_uz_latn, name_uz_cyrl, name_ru, name_en, code) 
SELECT id, 'Xo''jayli', 'Хўжайли', 'Ходжейли', 'Khojayli', 'QR02' FROM public.regions WHERE code = 'QR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.districts (region_id, name_uz_latn, name_uz_cyrl, name_ru, name_en, code) 
SELECT id, 'Qo''ng''irot', 'Қўнғирот', 'Кунград', 'Kungrad', 'QR03' FROM public.regions WHERE code = 'QR'
ON CONFLICT (code) DO NOTHING;

-- Add more districts as needed...

COMMENT ON SCHEMA public IS 'UniGo - Complete Transport Platform Schema';
