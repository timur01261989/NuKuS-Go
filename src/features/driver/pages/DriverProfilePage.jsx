import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * DriverProfilePage
 * Minimal placeholder page to prevent runtime crashes.
 * You can extend this page later with real profile fields/settings.
 */
export default function DriverProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Profil</h1>
            <button
              onClick={() => navigate(-1)}
              className="rounded-xl px-3 py-2 text-sm font-medium bg-black/5 hover:bg-black/10"
              type="button"
            >
              Orqaga
            </button>
          </div>

          <div className="mt-3 rounded-2xl bg-black/5 p-3 text-sm text-black/70">
            Bu sahifa hozircha bo&apos;sh. Keyin shu faylni tahrirlab profil
            ma&apos;lumotlarini qo&apos;shasiz.
          </div>
        </div>
      </div>
    </div>
  );
}
