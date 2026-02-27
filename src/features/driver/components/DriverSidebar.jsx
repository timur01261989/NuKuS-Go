import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@lib/supabase";

function Item({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition",
        active ? "bg-white/70 shadow-sm" : "hover:bg-white/50",
      ].join(" ")}
    >
      <span className="material-symbols-outlined text-[22px] text-slate-700">{icon}</span>
      <span className="text-[15px] font-semibold text-slate-800">{label}</span>
    </button>
  );
}

export default function DriverSidebar({ open, onClose, onLogout }) {
  const nav = useNavigate();
  const loc = useLocation();

  const go = (to) => {
    onClose?.();
    nav(to);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore; still continue
    } finally {
      onClose?.();
      onLogout?.();
      nav("/login");
    }
  };

  if (!open) return null;

  const path = loc.pathname;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* overlay */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Yopish"
      />

      {/* drawer */}
      <aside className="absolute inset-y-0 left-0 w-[78%] max-w-[320px] bg-[#f3f7ff] shadow-2xl rounded-r-[28px] p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] text-slate-500">Haydovchi menyusi</div>
            <div className="text-[20px] font-extrabold text-slate-900">Nukus Go</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/70 hover:bg-white shadow-sm"
            aria-label="Yopish"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <Item
            icon="person"
            label="Yolovchi sahifasi"
            active={path.startsWith("/client")}
            onClick={() => go("/client/home")}
          />
          <Item
            icon="history"
            label="Buyurtmalar tarixi"
            active={path.startsWith("/driver/orders")}
            onClick={() => go("/driver/orders")}
          />
          <Item
            icon="account_balance_wallet"
            label="Hisobni to‘ldirish"
            active={path.startsWith("/driver/wallet")}
            onClick={() => go("/driver/wallet")}
          />
          <Item
            icon="settings"
            label="Sozlamalar"
            active={path.startsWith("/driver/settings")}
            onClick={() => go("/driver/settings")}
          />
          <Item
            icon="local_activity"
            label="Promokodlar"
            active={path.startsWith("/driver/promo")}
            onClick={() => go("/driver/promo")}
          />
          <Item
            icon="help"
            label="Qo‘llanma"
            active={path.startsWith("/driver/guide")}
            onClick={() => go("/driver/guide")}
          />
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/80 hover:bg-white shadow-sm"
          >
            <span className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-red-600">logout</span>
              <span className="text-[15px] font-extrabold text-slate-900">Chiqish</span>
            </span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </button>

          <div className="mt-4 text-center">
            <div className="text-[14px] font-extrabold text-slate-900">Nukus Go</div>
            <div className="text-[12px] font-semibold text-slate-500">UniGo</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
