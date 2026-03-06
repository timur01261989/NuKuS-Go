# ⚡ UniGo - TEZKOR TEKSHIRISH RO'YXATI

**Qolgan Ishlar:** 4 ta KRITIK muammo  
**Completion:** 85% ✅

---

## 🔴 **BUGUN BAJARILADIGAN ISHLAR** (4 saat)

### **1️⃣ Fayl Nomi O'zgartirish**
- [ ] `UniGo_8.html` → `UniGo_8.zip` qilib o'zgarti
- **Nima:** Browser/Explorer archive extractor qilishi uchun
- **Vaqt:** 2 minut

### **2️⃣ .env Fayl Yaratish**
- [ ] Loyiha root'ida `.env` fayl yarat
- [ ] Quyidagi o'zgaruvchilarni fill qil:

```env
# SUPABASE (MAJBURIY)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ROUTING (default: OSRM - FREE)
VITE_OSRM_BASE_URL=http://router.project-osrm.org
VITE_ROUTE_PROVIDER=OSRM

# TRAFFIC (default: OSRM - FREE)
VITE_TRAFFIC_PROVIDER=OSRM

# OPTIONAL (Premium providers)
VITE_GOOGLE_API_KEY=
VITE_YANDEX_API_KEY=
VITE_MAPBOX_TOKEN=
```

- **Nima:** App'ni Supabase va mapping services'ga ulantiirish uchun
- **Vaqt:** 10 minut

### **3️⃣ Login Bug Fix** 
- [ ] Fayl: `src/features/auth/pages/Auth.jsx`
- [ ] **44-chi qator:** `setAppMode("client")` qatorini o'zgarti
- [ ] **78-chi qator:** `setAppMode("client")` qatorini o'zgarti

**O'zgarish:**
```javascript
// ❌ ESKI:
setAppMode("client");
navigate("/client/home");

// ✅ YANGI:
// app_mode'ni RootRedirect'ga topshir, u o'zi tekshirsin
navigate("/");
```

- **Nima:** Driver mode'da stuck bolishniyni oldini olish
- **Vaqt:** 5 minut

### **4️⃣ AppModeProvider Yaratish**
- [ ] Yangi fayl yarat: `src/providers/AppModeProvider.jsx`

```javascript
import { createContext, useContext, useState, useEffect } from "react";

const AppModeContext = createContext();

export function AppModeProvider({ children }) {
  const [appMode, setAppMode] = useState(() => {
    // localStorage dan o'qish (yoki session startup'da "client" default)
    if (typeof window !== 'undefined') {
      return localStorage.getItem("app_mode") || "client";
    }
    return "client";
  });
  
  // appMode o'zgarganda localStorage'ga saqla
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("app_mode", appMode);
    }
  }, [appMode]);
  
  return (
    <AppModeContext.Provider value={{ appMode, setAppMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within AppModeProvider");
  }
  return context;
}
```

- [ ] `src/App.jsx` o'zgarti:
```javascript
// ❌ ESKI:
function App() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>...</Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

// ✅ YANGI:
function App() {
  return (
    <ConfigProvider>
      <AppModeProvider>  {/* ← ADD THIS */}
        <BrowserRouter>
          <Routes>...</Routes>
        </BrowserRouter>
      </AppModeProvider>  {/* ← ADD THIS */}
    </ConfigProvider>
  );
}
```

- **Nima:** App mode'ni state'da saqlash (global access)
- **Vaqt:** 15 minut

---

## 🟡 **BU HAFTADA BAJARILADIGAN** (Dushanba-Chorshanba)

### **5️⃣ DriverRegister Back Button**
- [ ] Fayl: `src/features/driver/components/DriverRegister.jsx`
- [ ] Component'ning boshiga back button qo'shish:

```javascript
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAppMode } from "@/providers/AppModeProvider";

export default function DriverRegister() {
  const navigate = useNavigate();
  const { setAppMode } = useAppMode();
  
  const handleCancel = () => {
    setAppMode("client"); // mode'ni client'ga qaytaz
    navigate("/client/home");
  };
  
  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />}
        onClick={handleCancel}
        style={{ marginBottom: "16px" }}
      >
        Orqaga
      </Button>
      
      {/* Rest of form... */}
    </div>
  );
}
```

- **Nima:** Foydalanuvchi registratsiyani bekor qilish imkoni
- **Vaqt:** 10 minut

### **6️⃣ RootRedirect.jsx Update**
- [ ] Fayl: `src/pages/RootRedirect.jsx`
- [ ] localStorage dan `useAppMode`'ga o'tish:

```javascript
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppMode } from "@/providers/AppModeProvider";
import { Spin } from "antd";

export default function RootRedirect() {
  const navigate = useNavigate();
  const { appMode } = useAppMode();  // ← Context dan o'qish
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;

    // App mode'ga qarab navigate qil
    if (appMode === "driver") {
      navigate("/driver/home", { replace: true });
    } else {
      navigate("/client/home", { replace: true });
    }
  }, [appMode, navigate]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Spin size="large" />
    </div>
  );
}
```

- **Nima:** App mode'da avtomatik redirect
- **Vaqt:** 10 minut

### **7️⃣ SQL Schemas Run Qilish**
- [ ] Supabase Dashboard'ga kirish
- [ ] SQL Editor'ni ochish
- [ ] 5 ta SQL fayl'ni tartibi bo'yicha run qil:

```bash
# 1. Auth & Profiles (first)
supabase_min_auth_schema_FIXED.sql

# 2. Main schema (orders, drivers, etc)
supabase_schema.sql

# 3. Gamification (missions, levels)
supabase_gamification_schema.sql

# 4. Wallet (payments, transactions)
supabase_wallet_schema.sql

# 5. Notifications (push, messages)
supabase_notifications_schema.sql
```

- **Nima:** Database'ni to'liq setup qilish
- **Vaqt:** 20 minut (wait kuni o'z)
- **Kerak bo'lgan fayllar:** Layiha'da `*.sql` search qil

### **8️⃣ API Endpoints Test**
- [ ] Server running: `npm run dev`
- [ ] Test quyidagi endpoints:

```bash
# 1. Driver presence (heartbeat)
POST /api/dispatch
Body: {
  "action": "driver_ping",
  "driver_id": "test-uuid",
  "lat": 42.4601,
  "lng": 59.6120
}

# 2. Create order
POST /api/order
Body: {
  "action": "create",
  "passenger_id": "test-uuid",
  "pickup": { "lat": 42.46, "lng": 59.61 },
  "dropoff": { "lat": 42.47, "lng": 59.62 }
}

# 3. Get offers
GET /api/offer?order_id=test-uuid
```

- **Tool:** Postman yoki `curl`:
```bash
curl -X POST http://localhost:5173/api/dispatch \
  -H "Content-Type: application/json" \
  -d '{"action":"driver_ping","driver_id":"test"}'
```

- **Vaqt:** 30 minut

---

## 🟠 **KEYING HAFTADA** (Optional but recommended)

- [ ] **Leaflet Map CSS** - responsive dizain
- [ ] **Push Notifications** - real-time updates
- [ ] **Image Compression** - upload optimization
- [ ] **Error Handling** - user-friendly messages
- [ ] **Performance Test** - 1000+ drivers load

---

## ✅ **TEKSHIRISH CHECKLIST**

Quyidagini testing qil:

### **Login Flow**
- [ ] "Login" tugmani bosish
- [ ] Email + password kirish
- [ ] ✅ `/client/home` ga borish (client mode)
- [ ] Logout qilish
- [ ] Driver mode'da login (`app_mode=driver` o'rnatib)
- [ ] ✅ `/driver/home` ga borish
- [ ] ✅ Back button ishlamoq

### **Order Flow**
- [ ] Foydalanuvchi order yaratish
- [ ] ✅ Supabase'da `orders` jadvalida ko'rish
- [ ] Driver dispatch test
- [ ] ✅ Order assignment
- [ ] ✅ Offer creation

### **Map**
- [ ] Map loading
- [ ] Geolocation permission
- [ ] Driver marker showing
- [ ] Route calculation

### **Database**
- [ ] Supabase connection
- [ ] All tables created
- [ ] RLS policies active
- [ ] No errors in logs

---

## 📊 **PROGRESS TRACKER**

```
[████████░░░░░░░░░░] 50% Frontend
[███████████████░░░] 80% Backend  
[█████████████████░] 95% Database
[██████████████████] 100% Documentation

Overall: ███████████████░░░ 85% ✅
```

**Remaining:** 
- [ ] 2 Frontend bug fixes
- [ ] 1 Config file
- [ ] 1 Testing

---

## 🚨 **OGOHLANTIRISH**

### **Kerak BO'LMADI (Don't do):**
- ❌ localStorage/sessionStorage o'z-o'zidan (Context ishlat)
- ❌ Hardcoded URLs (`import.meta.env` ishlat)
- ❌ Direct DOM manipulation (React state ishlat)
- ❌ Unencrypted sensitive data (secrets `.env` da)

### **KERAK (Do):**
- ✅ React Context for global state (app_mode)
- ✅ Environment variables for config
- ✅ Component composition patterns
- ✅ Error boundaries
- ✅ Loading states

---

## 📝 **QUICK REFERENCE**

| Muammo | File | Fix | Time |
|--------|------|-----|------|
| File format | `UniGo_8.html` | → `.zip` | 2 min |
| Login bug | `Auth.jsx:44,78` | navigate("/") | 5 min |
| AppMode | `AppModeProvider.jsx` | Create file | 15 min |
| Back button | `DriverRegister.jsx` | Add button | 10 min |
| RootRedirect | `RootRedirect.jsx` | Use Context | 10 min |
| .env config | `.env` | Create file | 10 min |
| SQL schemas | 5 SQL files | Run in order | 20 min |
| **Total** | - | - | **1.5 hours** |

---

## 🎯 **FINISH LINE**

**Done Tasks:**
- ✅ Backend syntax errors fixed
- ✅ SQL schemas created (5 files)
- ✅ RLS policies added
- ✅ Performance indexes added
- ✅ Documentation complete

**Remaining:**
- ⏳ Frontend bug fixes (2)
- ⏳ Configuration setup (1)
- ⏳ Testing & validation (1)

**Next Steps:**
1. Fix the 4 items above
2. Run tests
3. Deploy to Vercel
4. Monitor in production

---

**Yaratilgan:** 2026-03-06  
**Oxirgi update:** 2026-03-06  
**Status:** 🟡 Ready for fixes (85% complete)

