# 🗄️ SQL FILES - DATABASE SCHEMA

Bu 5 ta SQL file **Supabase**'da **TARTIBI BO'YICHA** bajariladigan bo'lishi kerak:

## 📋 FILE TARTIBI (MUHIM!)

```
1. supabase_min_auth_schema_FIXED.sql
   ↓
2. supabase_schema.sql
   ↓
3. supabase_gamification_schema.sql
   ↓
4. supabase_wallet_schema.sql
   ↓
5. supabase_notifications_schema.sql
```

## 📥 HOW TO RUN

### Supabase Dashboard'da:
1. https://supabase.com ga kirish
2. Your Project → SQL Editor
3. Quyidagi SQL faylni copy-paste qil:
   - `supabase_min_auth_schema_FIXED.sql`
4. "Run" bosish
5. "Execution completed successfully" kutish
6. Keying faylga o'tish

### Bash'da (Local):
```bash
# supabase_min_auth_schema_FIXED.sql
psql -U postgres -h localhost -d your_db < supabase_min_auth_schema_FIXED.sql

# supabase_schema.sql
psql -U postgres -h localhost -d your_db < supabase_schema.sql

# (va hokazo...)
```

## ✅ EXPECTED RESULTS

### After supabase_min_auth_schema_FIXED.sql:
- ✅ profiles table created
- ✅ Auth triggers created
- ✅ RLS policies enabled

### After supabase_schema.sql:
- ✅ orders, drivers, driver_presence tables
- ✅ order_offers table
- ✅ All indexes created
- ✅ Foreign key constraints

### After supabase_gamification_schema.sql:
- ✅ daily_missions table
- ✅ mission_progress table
- ✅ driver_gamification table
- ✅ driver_levels table

### After supabase_wallet_schema.sql:
- ✅ wallets table
- ✅ wallet_transactions table
- ✅ transfer_wallet_funds function
- ✅ Payment ledger tables

### After supabase_notifications_schema.sql:
- ✅ notifications table
- ✅ push_subscriptions table
- ✅ notification_preferences table
- ✅ SMS/Email logging tables

## ⚠️ ERRORS & FIXES

### "Table already exists"
- SQL file idempotent (`IF NOT EXISTS`)
- Xech muammo yo'q, qayta bajarilishi mumkin

### "Cannot find table X"
- Oldingi SQL file run bo'lmagan
- Tartibi bo'yicha bajarilsin

### "Permission denied"
- Supabase service role key kerak
- Yoki Supabase dashboard'da run qil

## 📊 TOTAL SCHEMA

Barcha 5 ta fayl barimajon:
- **29 jadval**
- **70+ indexes**
- **20+ functions**
- **RLS policies** (hammasi enabled)

## 🎯 CRITICAL NOTES

- ⚠️ SQL files **TARTIBI BO'YICHA** bajariladishi kerak
- ⚠️ Bitta file skip qilsa → API crash!
- ⚠️ Barcha files **MAJBURIY**
- ⚠️ Fayllarni edit qilmang

## ✨ AFTER EVERYTHING

```bash
# Check tables created:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should show ~29 tables

---

**Status:** ✅ Ready  
**Total Time:** 30-45 minutes  
**Difficulty:** Easy (Copy-paste)

