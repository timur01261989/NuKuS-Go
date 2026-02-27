import React from "react";
import { useNavigate } from "react-router-dom";

export default function DriverPromoPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 flex items-center gap-3 border-b">
        <button
          className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <div className="font-extrabold">Promokodlar</div>
      </div>

      <div className="p-4 text-sm text-gray-600">
        Bu sahifa hozir placeholder. Keyin promokod qo‘shish/ko‘rish logikasini shu faylga qo‘shasan.
      </div>
    </div>
  );
}
