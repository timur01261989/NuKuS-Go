import React from "react";

function Modal({ open = false, children }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">{children}</div>;
}

export default React.memo(Modal);
