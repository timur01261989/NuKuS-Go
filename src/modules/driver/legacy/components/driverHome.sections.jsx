import React from "react";
import { Drawer, Switch } from "antd";
import DriverProfile from "./DriverProfile";

export function DriverHomeTopBar({ onOpenSidebar, driverHeader, tr, onOpenProfile }) {
  return (
    <header className="px-4 pt-4 pb-2 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="w-12 h-12 rounded-full neumorphic-pop flex items-center justify-center"
        aria-label={tr("menu", "Menyu")}
      >
        <span className="material-symbols-outlined" data-no-auto-translate="true">menu</span>
      </button>

      <button
        type="button"
        onClick={onOpenProfile}
        className="flex items-center gap-3"
        aria-label="Profil"
      >
        <div className="text-right">
          <p className="text-sm font-bold leading-tight">{driverHeader?.name || tr("driverTitle", "Haydovchi")}</p>
          <p className="text-xs text-slate-500">ID: {driverHeader?.publicId || "----"}</p>
        </div>

        <div className="w-12 h-12 rounded-full neumorphic-pop p-1">
          {driverHeader?.avatarUrl ? (
            <img alt="Driver Profile" className="w-full h-full rounded-full object-cover" src={driverHeader.avatarUrl} />
          ) : (
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primarySidebar">
              <span className="material-symbols-outlined" data-no-auto-translate="true">person</span>
            </div>
          )}
        </div>
      </button>
    </header>
  );
}

export function DriverStatusCard({ isOnline, activeServiceLabel, loading, onToggle, tr }) {
  return (
    <div className="px-4 py-2">
      <div className="neumorphic-pop rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-slate-400"}`} />
          <div>
            <p className="font-bold text-slate-800">{tr("driverStatus", "Haydovchi holati")}</p>
            <p className="text-sm text-slate-500">
              {tr("currentStatus", "Siz hozir")} {activeServiceLabel}
            </p>
          </div>
        </div>

        <label
          className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-colors ${isOnline ? "bg-primarySidebar" : "bg-slate-200"} ${loading ? "opacity-60" : "cursor-pointer"}`}
        >
          <input type="checkbox" className="sr-only" checked={isOnline} disabled={loading} onChange={(e) => onToggle(e.target.checked)} />
          <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${isOnline ? "translate-x-6" : "translate-x-0"}`} />
        </label>
      </div>
    </div>
  );
}

export function DriverVehicleCard({ summary, onOpenVehicles }) {
  return (
    <div className="px-4">
      <div className="neumorphic-pop rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-slate-800">Aktiv mashina</p>
          <p className="text-sm text-slate-500">{summary}</p>
        </div>
        <button
          type="button"
          onClick={onOpenVehicles}
          className="rounded-xl bg-primarySidebar px-4 py-2 text-sm font-semibold text-white shadow"
        >
          Mashinalar
        </button>
      </div>
    </div>
  );
}

export function DriverServiceMenu({ cards, onSelectService, emptyText }) {
  return (
    <main className="p-4 space-y-6 pb-24">
      <section className="space-y-4">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectService(card.key)}
            className={`w-full text-left neumorphic-pop rounded-2xl p-6 flex items-center justify-between border-2 ${card.buttonClassName}`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${card.iconClassName}`}>
                <span className="material-symbols-outlined text-4xl" data-no-auto-translate="true">{card.icon}</span>
              </div>
              <div>
                <h3 className={`${card.titleClassName} font-bold text-slate-900`}>{card.title}</h3>
                <p className="text-slate-500 text-sm">{card.hint}</p>
              </div>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${card.arrowClassName}`}>
              <span className="material-symbols-outlined" data-no-auto-translate="true">arrow_forward</span>
            </div>
          </button>
        ))}

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-amber-900">
            {emptyText}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function DriverBottomNav({ tr, onHome, onOrders, onSettings }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-2 flex justify-around items-center z-50">
      <button type="button" onClick={onHome} className="flex flex-col items-center gap-1 text-primarySidebar">
        <span className="material-symbols-outlined" data-no-auto-translate="true">home</span>
        <span className="text-[10px] font-bold">{tr("home", "Asosiy")}</span>
      </button>
      <button type="button" onClick={onOrders} className="flex flex-col items-center gap-1 text-slate-400">
        <span className="material-symbols-outlined" data-no-auto-translate="true">history</span>
        <span className="text-[10px] font-medium">{tr("orderHistoryDriver", tr("orders", "Buyurtmalar"))}</span>
      </button>
      <button type="button" onClick={onSettings} className="flex flex-col items-center gap-1 text-slate-400">
        <span className="material-symbols-outlined" data-no-auto-translate="true">settings</span>
        <span className="text-[10px] font-medium">{tr("settingsTitle", "Sozlamalar")}</span>
      </button>
    </nav>
  );
}

export function DriverProfileDrawer({
  open,
  onClose,
  drawerInnerRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isOnline,
  loading,
  onToggle,
  onLogout,
  tr,
}) {
  return (
    <Drawer placement="right" width="100%" closable={false} onClose={onClose} open={open} styles={{ body: { padding: 0 } }} maskClosable>
      <div
        ref={drawerInnerRef}
        style={{ height: "100%", background: "#fff", willChange: "transform", touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div style={{ padding: 12, background: "#111", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900 }}>Profil</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{isOnline ? tr("online", "Online") : tr("offline", "Offline")}</div>
            <Switch size="small" checked={isOnline} onChange={onToggle} loading={loading} />
          </div>
        </div>

        <DriverProfile onBack={onClose} onLogout={() => { onClose(); onLogout?.(); }} />
      </div>
    </Drawer>
  );
}
