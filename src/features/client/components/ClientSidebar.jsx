import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function ClientSidebar({ open, onClose, profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [balanceUZS, setBalanceUZS] = useState(null);

  const fullName = profile?.fullName || "Foydalanuvchi";
  const avatarUrl = profile?.avatarUrl || "";

  const initial = useMemo(() => {
    const s = String(fullName || "").trim();
    return (s[0] || "U").toUpperCase();
  }, [fullName]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const user = u?.user;
        if (!user) return;

        // If wallet API exists in backend, use it. If not, keep placeholder.
        try {
          const { getWalletBalance } = await import("@/services/walletApi.js");
          const j = await getWalletBalance(user.id);
          const bal = typeof j?.balance_uzs === "number" ? j.balance_uzs : null;
          if (mounted) setBalanceUZS(bal);
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const go = (path, opts) => {
    onClose?.();
    navigate(path, opts);
  };

  const balanceLabel =
    typeof balanceUZS === "number"
      ? new Intl.NumberFormat("uz-UZ").format(balanceUZS) + " so'm"
      : "—";

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85%] bg-white dark:bg-background-dark shadow-2xl flex flex-col">
        {/* Profile */}
        <div className="p-6 bg-primarySidebar/10 dark:bg-primarySidebar/5 border-b border-primarySidebar/10">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full border-2 border-primarySidebar overflow-hidden bg-white flex items-center justify-center">
              {avatarUrl ? (
                <img
                  className="w-full h-full object-cover"
                  alt="avatar"
                  src={avatarUrl}
                />
              ) : (
                <span className="text-xl font-bold text-primarySidebar">{initial}</span>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {fullName}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="size-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 italic">
                  Yo'lovchi
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Balans
              </p>
              <p className="text-sm font-bold text-primarySidebar">{balanceLabel}</p>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Reyting
              </p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">4.9</p>
                <span className="material-symbols-outlined text-[14px] text-yellow-500 font-variation-fill">
                  star
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <button
            type="button"
            className="w-full flex items-center gap-4 p-3 rounded-xl transition-colors bg-primarySidebar/10 text-primarySidebar border border-primarySidebar/20 text-left"
            onClick={() =>
              go("/driver-mode", {
                replace: true,
                state: { from: location.pathname },
              })
            }
          >
            <span className="material-symbols-outlined">local_taxi</span>
            <span className="font-semibold">Taksi bo'lib ishlash</span>
          </button>

          <div className="py-2">
            <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3" />
          </div>

          <SidebarItem
            icon="location_on"
            label="Mening manzillarim"
            onClick={() => go("/client/addresses")}
          />
          <SidebarItem
            icon="history"
            label="Buyurtmalar tarixi"
            onClick={() => go("/client/orders")}
          />
          <SidebarItem
            icon="payments"
            label="To'lov usullari"
            onClick={() => go("/client/payment-methods")}
          />
          <SidebarItem
            icon="card_giftcard"
            label="Promokodlar"
            onClick={() => go("/client/promo")}
          />

          <div className="py-2">
            <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3" />
          </div>

          <SidebarItem icon="settings" label="Sozlamalar" onClick={() => go("/settings")} />
          <SidebarItem icon="help_center" label="Yordam" onClick={() => go("/support")} />
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            className="flex items-center gap-3 w-full text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors group"
            onClick={() => go("/logout")}
          >
            <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-300">
              logout
            </span>
            <span className="font-medium">Chiqish</span>
          </button>
          <p className="mt-4 text-center text-[10px] text-slate-400 font-medium">
            Nukus Go
          </p>
          <p className="mt-1 text-center text-[10px] text-slate-500 font-semibold">
            UniGo
          </p>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      className={cx(
        "w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-left",
        active
          ? "bg-primarySidebar/10 text-primarySidebar border border-primarySidebar/20"
          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
      )}
      onClick={onClick}
    >
      <span className={cx("material-symbols-outlined", active ? "" : "text-slate-400")}>
        {icon}
      </span>
      <span className={cx(active ? "font-semibold" : "font-medium")}>{label}</span>
    </button>
  );
}
