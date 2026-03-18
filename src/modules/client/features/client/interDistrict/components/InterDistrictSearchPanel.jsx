
import React from "react";
import { Button, Divider, Typography } from "antd";
import DistrictList from "../components/Selection/DistrictList";
import DepartureTime from "../components/Selection/DepartureTime";
import CarSeatSchema from "../components/Seats/CarSeatSchema";
import SeatLegend from "../components/Seats/SeatLegend";
import FilterBar from "../components/Drivers/FilterBar";

export default function InterDistrictSearchPanel({ openPicker, locateMe, searching, canSearch, onSearch }) {
  return (
    <>
      <div style={{ marginTop: 12 }}>
        <DistrictList onOpenPicker={openPicker} onLocateMe={locateMe} />
      </div>
      <div style={{ marginTop: 12 }}>
        <DepartureTime />
      </div>
      <div style={{ marginTop: 12 }}>
        <CarSeatSchema />
      </div>
      <div style={{ marginTop: 12 }}>
        <SeatLegend />
      </div>
      <div style={{ marginTop: 12 }}>
        <FilterBar />
      </div>
      <Divider />
      <Button type="primary" loading={searching} disabled={!canSearch} onClick={onSearch} style={{ width: "100%", borderRadius: 16, height: 44 }}>
        Reys izlash
      </Button>
    </>
  );
}
