import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

export default function DriverSidebar({ open, onClose, onLogout }) {
  const navigate = useNavigate();

  const go = (path) => {
    onClose?.();
    navigate(path);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    onClose?.();
    onLogout?.();
    navigate("/login");
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 z-[70] w-[86%] max-w-[360px] bg-backgroundLightDriver text-slate-900 shadow-2xl">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold text-primarySidebar leading-none">Nukus Go</div>
                <div className="text-sm text-slate-500 mt-1">Haydovchi menyusi</div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl neumorphic-pop text-slate-700"
                aria-label="Yopish"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Menu */}
          <div className="px-4 pb-4 flex-1 overflow-auto">
            <div className="space-y-3">
              <MenuItem icon="person" title="Yolovchi sahifasi" onClick={() => go("/client/home")} />
              <MenuItem icon="history" title="Buyurtmalar tarixi" onClick={() => go("/driver/orders")} />
              <MenuItem icon="account_balance_wallet" title="Hisobni to'ldirish" onClick={() => go("/driver/wallet")} />
              <MenuItem icon="settings" title="Sozlamalar" onClick={() => go("/driver/settings")} />
              <MenuItem icon="confirmation_number" title="Promokodlar" onClick={() => go("/driver/promo")} />
              <MenuItem icon="help" title="Qo'llanma" onClick={() => go("/driver/guide")} />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200/70 bg-white/40 backdrop-blur">
            <button
              type="button"
              onClick={logout}
              className="w-full neumorphic-pop rounded-2xl px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 text-red-600">
                <span className="material-symbols-outlined">logout</span>
                <span className="font-bold">Chiqish</span>
              </div>
              <span className="material-symbols-outlined text-red-600">arrow_forward</span>
            </button>

            <div className="mt-4 text-center">
              <div className="text-sm font-extrabold text-slate-800">Nukus Go</div>
              <div className="text-xs text-slate-500">UniGo</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function MenuItem({ icon, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full neumorphic-pop rounded-2xl px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primarySidebar">{icon}</span>
        <span className="font-bold text-slate-800">{title}</span>
      </div>
      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
    </button>
  );
}
