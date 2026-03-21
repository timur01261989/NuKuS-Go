
import React from "react";
import { Typography } from "antd";
import TripCard from "../components/Trips/TripCard";

export default function InterDistrictResultsSection({ searching, trips, onRequest }) {
  return (
    <>
      <Typography.Title level={5} style={{ margin: "14px 0 10px" }}>
        Topilgan reyslar
      </Typography.Title>
      {searching ? (
        <div style={{ color: "#666" }}>Qidirilmoqda...</div>
      ) : trips.length ? (
        trips.map((trip) => <TripCard key={trip.id} trip={trip} onRequest={onRequest} />)
      ) : (
        <div style={{ color: "#666" }}>Hozircha reys topilmadi.</div>
      )}
    </>
  );
}
