
import React from "react";
import FiltersDrawer from "./FiltersDrawer";

/** market.txt da FilterModal deyilgan, biz Drawer ishlatyapmiz */
export default function FilterModal({ open, onClose }) {
  return <FiltersDrawer open={open} onClose={onClose} />;
}
