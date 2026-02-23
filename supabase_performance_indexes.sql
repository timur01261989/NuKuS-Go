-- ============================================================
-- NUKUS GO — Performance Indexes & Wallet Atomic Transaction
-- ============================================================
-- Bu faylni Supabase Dashboard > SQL Editor da ishga tushiring.
-- Avval supabase_taxi_full_schema_rls.sql va supabase_full6_features.sql
-- ishga tushirilgan bo'lishi kerak.
-- ============================================================

-- -------------------------------------------------------
-- 1. driver_presence — composite index (online + updated_at)
--    Dispatch har dispatch so'rovida shu filtr bilan qidiradi
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_driver_presence_online_updated
  ON driver_presence(is_online, updated_at DESC)
  WHERE is_online = true;

-- -------------------------------------------------------
-- 2. order_offers — composite indexes (dispatch uchun)
--    Har bir dispatch ikki xil filtr ishlatadi
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_offers_order_status
  ON order_offers(order_id, status);

CREATE INDEX IF NOT EXISTS idx_offers_driver_status_expires
  ON order_offers(driver_user_id, status, expires_at DESC);

-- Partial index: faqat faol (sent) offerlar uchun
CREATE INDEX IF NOT EXISTS idx_offers_active_sent
  ON order_offers(order_id, expires_at DESC)
  WHERE status = 'sent';

-- -------------------------------------------------------
-- 3. orders — status + created_at (dispatch va driver feed)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);

-- -------------------------------------------------------
-- 4. profiles — role column (RoleGate har sahifada chaqiradi)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role);

-- -------------------------------------------------------
-- 5. driver_applications — user_id + created_at (RoleGate)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_driver_applications_user_created
  ON driver_applications(user_id, created_at DESC);

-- -------------------------------------------------------
-- 6. notifications — user_id + created_at (already in full6, but ensure)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

-- -------------------------------------------------------
-- 7. wallet_transactions — atomic transfer funksiyasi
--    Ikki alohida UPDATE o'rniga bitta atomic transaction
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION transfer_wallet_funds(
  p_from_user  UUID,
  p_to_user    UUID,
  p_amount     NUMERIC,
  p_order_id   UUID DEFAULT NULL,
  p_note       TEXT DEFAULT 'transfer'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_balance NUMERIC;
  v_to_balance   NUMERIC;
BEGIN
  -- 1) Yuboruvchi balansini tekshirish va kamaytirish (LOCK)
  UPDATE wallets
    SET balance = balance - p_amount,
        updated_at = NOW()
  WHERE user_id = p_from_user
    AND balance >= p_amount
  RETURNING balance INTO v_from_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE: Balansingiz yetarli emas';
  END IF;

  -- 2) Qabul qiluvchi balansini oshirish
  UPDATE wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
  WHERE user_id = p_to_user
  RETURNING balance INTO v_to_balance;

  IF NOT FOUND THEN
    -- Qabul qiluvchida wallet yo'q — yaratish
    INSERT INTO wallets(user_id, balance, currency, created_at, updated_at)
    VALUES (p_to_user, p_amount, 'UZS', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET balance = wallets.balance + p_amount, updated_at = NOW()
    RETURNING balance INTO v_to_balance;
  END IF;

  -- 3) Tranzaksiya logini yozish
  INSERT INTO wallet_transactions(
    user_id, amount, type, order_id, note, created_at
  ) VALUES
    (p_from_user, -p_amount, 'debit',  p_order_id, p_note, NOW()),
    (p_to_user,   p_amount,  'credit', p_order_id, p_note, NOW());

  RETURN json_build_object(
    'ok', true,
    'from_balance', v_from_balance,
    'to_balance', v_to_balance
  );
END;
$$;

-- -------------------------------------------------------
-- 8. order_events — index (order_id + created_at)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_order_events_order_created
  ON order_events(order_id, created_at DESC);

-- -------------------------------------------------------
-- 9. drivers — user_id index (RoleGate parallel so'rovda)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_drivers_user_id
  ON drivers(user_id);

-- ============================================================
-- ESLATMA: PostGIS geo index (katta hajm uchun — 500+ haydovchi)
-- ============================================================
-- Agar haydovchilar soni 500+ ga yetsa, quyidagi migratsiyani
-- ishga tushiring (supabase_postgis_geo_index.sql faylida).
-- Hozircha haversine JS'da yetarli.
-- ============================================================
