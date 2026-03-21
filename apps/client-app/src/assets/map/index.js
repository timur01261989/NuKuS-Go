import mapUserArrowAlt from "./user-location/map-user-arrow-alt.webp";
import mapUserSelfAlt from "./user-location/map-user-self-alt.webp";
import mapUserArrow from "./user-location/map-user-arrow.webp";
import mapUserSelf from "./user-location/map-user-self.webp";
import mapUserArrowLive from "./user-location/map-user-arrow-live.webp";
import mapUserSelfLive from "./user-location/map-user-self-live.webp";
import mapCurrentLocation from "./user-location/map-current-location.png";
import mapPinLocation from "./user-location/map-pin-location.png";
import mapPinDirection from "./user-location/map-pin-direction.png";
import mapRoutePoint from "./route-points/map-route-point.webp";
import mapRoutePointTrack from "./route-points/map-route-point-track.webp";
import mapRoutePointLive from "./route-points/map-route-point-live.webp";
import mapPinOutlinePng from "./route-points/map-pin-outline.png";
import mapPinSolidPng from "./route-points/map-pin-solid.png";
import mapPinFill from "./route-points/map-pin-fill.svg";
import mapPinOutline from "./route-points/map-pin-outline.svg";
import mapPinInactive from "./pins/map-pin-inactive.webp";
import mapPinInactiveDark from "./pins/map-pin-inactive-dark.webp";
import mapPinFuelStation from "./pins/map-pin-fuel-station.webp";
import mapPinFuelStationLive from "./pins/map-pin-fuel-station-live.webp";
import mapPinCarWash from "./pins/map-pin-car-wash.webp";
import mapPinCarWashBooking from "./pins/map-pin-car-wash-booking.webp";
import mapPinGasDiscount from "./pins/map-pin-gas-discount.webp";
import mapPinGasDiscountLive from "./pins/map-pin-gas-discount-live.webp";
import mapPinFuelDiscount from "./pins/map-pin-fuel-discount.webp";
import mapPinElectricStation from "./pins/map-pin-electric-station.webp";
import mapPinGasStation from "./pins/map-pin-gas-station.webp";
import mapPickupPoint from "./pins/map-pickup-point.webp";
import mapPickupPointLive from "./pins/map-pickup-point-live.webp";
import mapDeliveryPoint from "./pins/map-delivery-point.webp";
import mapDeliveryPointLive from "./pins/map-delivery-point-live.webp";

export const mapAssets = {
  userArrow: mapUserArrow,
  userArrowAlt: mapUserArrowAlt,
  userSelf: mapUserSelf,
  userSelfAlt: mapUserSelfAlt,
  userArrowLive: mapUserArrowLive,
  userSelfLive: mapUserSelfLive,
  currentLocation: mapCurrentLocation,
  pinLocation: mapPinLocation,
  pinDirection: mapPinDirection,
  routePoint: mapRoutePoint,
  routePointTrack: mapRoutePointTrack,
  routePointLive: mapRoutePointLive,
  pinOutlinePng: mapPinOutlinePng,
  pinSolidPng: mapPinSolidPng,
  pinFill: mapPinFill,
  pinOutline: mapPinOutline,
  pinInactive: mapPinInactive,
  pinInactiveDark: mapPinInactiveDark,
  pinFuelStation: mapPinFuelStation,
  pinFuelStationLive: mapPinFuelStationLive,
  pinCarWash: mapPinCarWash,
  pinCarWashBooking: mapPinCarWashBooking,
  pinGasDiscount: mapPinGasDiscount,
  pinGasDiscountLive: mapPinGasDiscountLive,
  pinFuelDiscount: mapPinFuelDiscount,
  pinElectricStation: mapPinElectricStation,
  pinGasStation: mapPinGasStation,
  pickupPoint: mapPickupPoint,
  pickupPointLive: mapPickupPointLive,
  deliveryPoint: mapDeliveryPoint,
  deliveryPointLive: mapDeliveryPointLive,
};


export * from "./curated/index.js";
export { curatedMapAssets } from "./curated/index.js";

import { curatedMapAssets } from "./curated/index.js";

mapAssets.controlCompass = curatedMapAssets.pickup.mapControlCompass;
mapAssets.controlLocation = curatedMapAssets.pickup.mapControlLocation;
mapAssets.clientPinDay = curatedMapAssets.pickup.mapPinClientDay;
mapAssets.clientPinNight = curatedMapAssets.pickup.mapPinClientNight;
mapAssets.dropoffPin = curatedMapAssets.pickup.mapPinDropoff;
mapAssets.startPin = curatedMapAssets.pickup.mapPinStart;
mapAssets.finishPin = curatedMapAssets.pickup.mapPinFinish;
mapAssets.searchCar = curatedMapAssets.pickup.mapSearchCar;
mapAssets.searchCarStart = curatedMapAssets.pickup.mapSearchCarStart;
mapAssets.userPlacemark = curatedMapAssets.pickup.mapUserPlacemark;
mapAssets.courierBikeMarker = curatedMapAssets.courier.mapCourierBikeMarker;
mapAssets.courierCursor = curatedMapAssets.courier.mapCourierCursor;
mapAssets.poiAirportPin = curatedMapAssets.poi.poiAirportPin;
mapAssets.poiFuelStation = curatedMapAssets.poi.poiFuelStation;
mapAssets.poiGasFill = curatedMapAssets.poi.poiGasFill;
mapAssets.poiCarwash = curatedMapAssets.poi.poiCarwash;


mapAssets.routePointActive = curatedMapAssets.pickup.mapRoutePointActive;
mapAssets.routePointError = curatedMapAssets.pickup.mapPointError;
mapAssets.routePointPrimary = curatedMapAssets.pickup.mapPointPrimary;
mapAssets.pickupPin = curatedMapAssets.pickup.mapPinClientDay;
mapAssets.pickupPinNight = curatedMapAssets.pickup.mapPinClientNight;
mapAssets.dropoffPinNight = curatedMapAssets.pickup.mapPinDeliveryUndoNight;
mapAssets.restaurantPinDay = curatedMapAssets.pickup.mapPinRestaurantDay;
mapAssets.restaurantPinNight = curatedMapAssets.pickup.mapPinRestaurantNight;
mapAssets.incidentPin = curatedMapAssets.pickup.mapPinIncidentAlert;
mapAssets.crashPin = curatedMapAssets.pickup.mapPinIncidentCrash;
mapAssets.controlTraffic = curatedMapAssets.poi.poiFuelStation || curatedMapAssets.poi.poiGasFill;
mapAssets.controlParking = curatedMapAssets.poi.poiStationStore || curatedMapAssets.poi.poiStation;
mapAssets.poiAirport = curatedMapAssets.poi.poiAirport;
mapAssets.poiAirportPreview = curatedMapAssets.poi.poiAirportPreview;
mapAssets.poiBridge = curatedMapAssets.poi.poiBridge;
mapAssets.poiCarwash = curatedMapAssets.poi.poiCarwash;
mapAssets.poiCarwashBooking = curatedMapAssets.poi.poiCarwashBooking;
mapAssets.poiFuelStationOutline = curatedMapAssets.poi.poiFuelStationOutline;
mapAssets.poiFuelPreview = curatedMapAssets.poi.poiFuelStationPreview;
mapAssets.poiHospital = curatedMapAssets.poi.poiHospital;
mapAssets.poiStationStore = curatedMapAssets.poi.poiStationStore;
mapAssets.poiSubwayStation = curatedMapAssets.poi.poiSubwayStation;
mapAssets.poiRailwayStation = curatedMapAssets.poi.poiRailwayStation;

export const mapVisuals = {
  controls: {
    location: mapAssets.controlLocation,
    compass: mapAssets.controlCompass,
    parking: mapAssets.controlParking,
    traffic: mapAssets.controlTraffic,
  },
  pickup: {
    start: mapAssets.startPin,
    pickup: mapAssets.pickupPin,
    pickupNight: mapAssets.pickupPinNight,
    finish: mapAssets.finishPin,
    dropoff: mapAssets.dropoffPin,
    dropoffNight: mapAssets.dropoffPinNight,
    restaurantDay: mapAssets.restaurantPinDay,
    restaurantNight: mapAssets.restaurantPinNight,
    routeActive: mapAssets.routePointActive,
    routePrimary: mapAssets.routePointPrimary,
    routeError: mapAssets.routePointError,
    incident: mapAssets.incidentPin,
    crash: mapAssets.crashPin,
  },
  courier: {
    bike: mapAssets.courierBikeMarker,
    cursor: mapAssets.courierCursor,
  },
  poi: {
    airport: mapAssets.poiAirport,
    airportPin: mapAssets.poiAirportPin,
    airportPreview: mapAssets.poiAirportPreview,
    bridge: mapAssets.poiBridge,
    fuel: mapAssets.poiFuelStation,
    fuelOutline: mapAssets.poiFuelStationOutline,
    fuelPreview: mapAssets.poiFuelPreview,
    gas: mapAssets.poiGasFill,
    carwash: mapAssets.poiCarwash,
    carwashBooking: mapAssets.poiCarwashBooking,
    hospital: mapAssets.poiHospital,
    stationStore: mapAssets.poiStationStore,
    subway: mapAssets.poiSubwayStation,
    railway: mapAssets.poiRailwayStation,
  },
};
