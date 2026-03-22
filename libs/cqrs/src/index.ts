// ── Command Bus ───────────────────────────────────────────────────────────────
export interface Command<T = any> {
  type:    string;
  payload: T;
  metadata?: { user_id?: string; correlation_id?: string };
}

export interface CommandHandler<T = any, R = any> {
  handle(command: Command<T>): Promise<R>;
}

export class CommandBus {
  private handlers = new Map<string, CommandHandler>();

  register<T, R>(commandType: string, handler: CommandHandler<T, R>): void {
    this.handlers.set(commandType, handler);
  }

  async dispatch<T, R>(command: Command<T>): Promise<R> {
    const handler = this.handlers.get(command.type);
    if (!handler) throw new Error(`No handler for command: ${command.type}`);
    return handler.handle(command) as Promise<R>;
  }
}

// ── Query Bus ─────────────────────────────────────────────────────────────────
export interface Query<T = any> {
  type:    string;
  payload: T;
}

export interface QueryHandler<T = any, R = any> {
  handle(query: Query<T>): Promise<R>;
}

export class QueryBus {
  private handlers = new Map<string, QueryHandler>();

  register<T, R>(queryType: string, handler: QueryHandler<T, R>): void {
    this.handlers.set(queryType, handler);
  }

  async execute<T, R>(query: Query<T>): Promise<R> {
    const handler = this.handlers.get(query.type);
    if (!handler) throw new Error(`No handler for query: ${query.type}`);
    return handler.handle(query) as Promise<R>;
  }
}

// ── Read Model (Projection) ───────────────────────────────────────────────────
export interface Projection<TState = any> {
  name:    string;
  init():  TState;
  apply(state: TState, event: any): TState;
}

export class ProjectionEngine {
  private projections = new Map<string, { proj: Projection; state: any }>();

  register(projection: Projection): void {
    this.projections.set(projection.name, {
      proj:  projection,
      state: projection.init(),
    });
  }

  project(projectionName: string, events: any[]): any {
    const entry = this.projections.get(projectionName);
    if (!entry) throw new Error(`Projection not found: ${projectionName}`);
    let state = entry.proj.init();
    for (const event of events) {
      state = entry.proj.apply(state, event);
    }
    return state;
  }
}

// ── Predefined Commands ───────────────────────────────────────────────────────
export const Commands = {
  CREATE_ORDER:    "CreateOrder",
  CANCEL_ORDER:    "CancelOrder",
  ACCEPT_OFFER:    "AcceptOffer",
  COMPLETE_RIDE:   "CompleteRide",
  PROCESS_PAYMENT: "ProcessPayment",
  UPDATE_LOCATION: "UpdateDriverLocation",
  SEND_MESSAGE:    "SendChatMessage",
  TRIGGER_SOS:     "TriggerSOS",
};

// ── Predefined Queries ────────────────────────────────────────────────────────
export const Queries = {
  GET_ORDER:          "GetOrder",
  GET_NEARBY_DRIVERS: "GetNearbyDrivers",
  GET_USER_ORDERS:    "GetUserOrders",
  GET_ETA:            "GetETA",
  GET_SURGE:          "GetSurgePricing",
  GET_WALLET:         "GetWallet",
  GET_EARNINGS:       "GetEarnings",
};

export const commandBus = new CommandBus();
export const queryBus   = new QueryBus();
