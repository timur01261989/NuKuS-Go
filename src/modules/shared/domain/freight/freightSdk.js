import {
  acceptOffer,
  cancelCargo,
  cargoStatus,
  createCargo,
  listOffers,
  matchVehicles,
} from "@/modules/client/features/client/freight/services/freightApi";

export const freightSdk = {
  createCargo,
  cancelCargo,
  cargoStatus,
  matchVehicles,
  listOffers,
  acceptOffer,
};

export {
  acceptOffer,
  cancelCargo,
  cargoStatus,
  createCargo,
  listOffers,
  matchVehicles,
};