import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@lib/supabase";

export default function DriverSidebar({
  open,
  onClose,
  onGoClient,
  onGoOrders,
  onGoWallet,
  onGoSettings,
  onGoPromo,
  onGoGuide,
  onLogout,
}) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid) return;
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name, phone, role")
          .eq("id", uid)
          .maybeSingle();
        if (!cancelled) setProfile(p || null);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const items = useMemo(
    () => [
      { label: "Yolovchi sahifasi", icon: "swap_horiz", onClick: onGoClient },
      { label: "Buyurtmalar tarixi", icon: "receipt_long", onClick: onGoOrders },
      { label: "Hisobni to‘ldirish", icon: "account_balance_wallet", onClick: onGoWallet },
      { label: "Sozlamalar", icon: "settings", onClick: onGoSettings },
      { label: "Promokodlar", icon: "sell", onClick: onGoPromo },
      { label: "Qo‘llanma", icon: "menu_book", onClick: onGoGuide },
    ],
    [onGoClient, onGoOrders, onGoWallet, onGoSettings, onGoPromo, onGoGuide]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* drawer */}
      <aside className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-white shadow-2xl">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="material-symbols-rounded">person</span>
              </div>
              <div>
                <div className="font-extrabold leading-5">
                  {profile?.full_name || "Haydovchi"}
                </div>
                <div className="text-xs text-gray-500">{profile?.phone || ""}</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
              aria-label="Close"
            >
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className="space-y-1">
            {items.map((it) => (
              <button
                key={it.label}
                onClick={it.onClick}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-gray-50 active:scale-[0.99] text-left"
              >
                <span className="material-symbols-rounded text-[22px]">{it.icon}</span>
                <span className="font-semibold">{it.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 border-t pt-3">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 bg-red-50 text-red-700 hover:bg-red-100 active:scale-[0.99] text-left"
            >
              <span className="material-symbols-rounded text-[22px]">logout</span>
              <span className="font-extrabold">Chiqish</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="text-sm font-extrabold">Nukus Go</div>
          <div className="text-xs text-gray-500">UniGo</div>
        </div>
      </aside>
    </div>
  );
}
