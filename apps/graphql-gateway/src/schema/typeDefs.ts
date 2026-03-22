import { gql } from "apollo-server-express";

export const typeDefs = gql\`
  scalar DateTime
  scalar JSON

  # ── Core Types ────────────────────────────────────────────────────
  type User {
    id:           ID!
    phone:        String
    full_name:    String
    avatar_url:   String
    role:         String!
    language:     String!
    wallet:       Wallet
    subscription: Subscription
    active_orders:[Order!]!
    created_at:   DateTime!
  }

  type Driver {
    id:           ID!
    user_id:      ID!
    status:       DriverStatus!
    rating:       Float!
    total_rides:  Int!
    vehicle:      Vehicle
    location:     DriverLocation
    earnings_today: Float
  }

  enum DriverStatus { ONLINE OFFLINE ON_TRIP }

  type DriverLocation {
    lat:    Float!
    lng:    Float!
    bearing: Float
    speed:   Float
    updated_at: DateTime!
  }

  type Vehicle {
    id:          ID!
    brand:       String!
    model:       String!
    year:        Int!
    plate_number:String!
    color:       String
    type:        VehicleType!
  }

  enum VehicleType { SEDAN SUV MINIVAN TRUCK ELECTRIC }

  type Order {
    id:              ID!
    client_id:       ID!
    driver_id:       ID
    service_type:    ServiceType!
    status:          OrderStatus!
    pickup:          Location!
    dropoff:         Location!
    price_uzs:       Float!
    surge_multiplier:Float!
    payment_method:  String!
    distance_km:     Float
    eta_minutes:     Int
    route_polyline:  String
    stops:           [Location!]
    created_at:      DateTime!
    updated_at:      DateTime
    client:          User
    driver:          Driver
    chat_room:       ChatRoom
  }

  enum ServiceType { TAXI DELIVERY FREIGHT INTERCITY INTERDISTRICT FOOD }
  enum OrderStatus {
    SEARCHING ACCEPTED ARRIVED IN_PROGRESS COMPLETED CANCELLED
  }

  type Location {
    lat:     Float!
    lng:     Float!
    address: String
  }

  type Wallet {
    user_id:     ID!
    balance_uzs: Float!
    locked_uzs:  Float!
    total_earned:Float!
    total_spent: Float!
  }

  type Subscription {
    id:          ID!
    plan_id:     String!
    status:      String!
    expires_at:  DateTime!
    benefits:    JSON
  }

  type ChatRoom {
    id:            ID!
    order_id:      ID!
    messages(limit: Int, before: DateTime): [ChatMessage!]!
    unread_client: Int!
    unread_driver: Int!
    status:        String!
  }

  type ChatMessage {
    id:          ID!
    sender_id:   ID!
    sender_role: String!
    content:     String!
    type:        String!
    is_read:     Boolean!
    created_at:  DateTime!
  }

  type ETAResult {
    eta_minutes:   Float!
    distance_km:   Float!
    surge_factor:  Float!
    traffic_level: String!
  }

  type NearbyDriver {
    driver_id:   ID!
    lat:         Float!
    lng:         Float!
    distance_km: Float!
    eta_minutes: Float!
    rating:      Float!
    vehicle:     Vehicle
  }

  type SurgePricing {
    surge_factor:  Float!
    zone:          String!
    estimated_wait:Int!
    advice:        String!
  }

  type EarningsSummary {
    today_net:    Float!
    today_trips:  Int!
    week_net:     Float!
    week_trips:   Int!
    month_net:    Float!
    peak_hour:    Int!
  }

  # ── Queries ───────────────────────────────────────────────────────
  type Query {
    me:                         User
    user(id: ID!):              User
    order(id: ID!):             Order
    myOrders(limit: Int, offset: Int): [Order!]!
    nearbyDrivers(lat: Float!, lng: Float!, radius_km: Float, service_type: ServiceType): [NearbyDriver!]!
    eta(pickup: LocationInput!, dropoff: LocationInput!): ETAResult!
    surgePricing(lat: Float!, lng: Float!): SurgePricing!
    chatRoom(order_id: ID!):    ChatRoom
    myEarnings:                 EarningsSummary
    driver(id: ID!):            Driver
    searchPlaces(q: String!, city: String, lat: Float, lng: Float): [PlaceResult!]!
  }

  input LocationInput {
    lat:     Float!
    lng:     Float!
    address: String
  }

  type PlaceResult {
    id:      ID!
    name:    String!
    address: String
    lat:     Float!
    lng:     Float!
    distance_km: Float
  }

  # ── Mutations ─────────────────────────────────────────────────────
  type Mutation {
    createOrder(input: CreateOrderInput!):          Order!
    cancelOrder(id: ID!, reason: String):           Order!
    acceptOffer(order_id: ID!, driver_id: ID!):     Order!
    completeOrder(id: ID!):                         Order!
    sendMessage(room_id: ID!, content: String!, type: String): ChatMessage!
    markChatRead(room_id: ID!, role: String!):      Boolean!
    topUpWallet(amount: Float!, provider: String!): Wallet!
    subscribeplan(plan_id: String!, billing: String!): Subscription!
    updateDriverLocation(lat: Float!, lng: Float!, bearing: Float, speed: Float): Boolean!
    triggerSOS(order_id: ID!, lat: Float!, lng: Float!): Boolean!
  }

  input CreateOrderInput {
    service_type:   ServiceType!
    pickup:         LocationInput!
    dropoff:        LocationInput!
    stops:          [LocationInput!]
    payment_method: String
    promo_code:     String
    scheduled_at:   DateTime
    notes:          String
  }

  # ── Subscriptions ─────────────────────────────────────────────────
  type Subscription {
    orderStatusChanged(order_id: ID!):  Order!
    driverLocationUpdated(driver_id: ID!): DriverLocation!
    newChatMessage(room_id: ID!):       ChatMessage!
    surgeZoneUpdated(lat: Float!, lng: Float!): SurgePricing!
  }
\`;
