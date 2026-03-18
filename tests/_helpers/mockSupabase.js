
export function createMemorySupabase(initial = {}) {
  const state = {
    wallets: new Map(),
    wallet_transactions: [],
    wallet_ledger: [],
    orders: new Map(),
  };

  for (const row of initial.wallets || []) state.wallets.set(row.user_id, { ...row });
  for (const row of initial.orders || []) state.orders.set(row.id, { ...row });

  function tableApi(table) {
    const ctx = {
      _table: table,
      _filters: [],
      _select: null,
      _payload: null,
      _upsertPayload: null,
    };

    const api = {
      select(columns) { ctx._select = columns; return api; },
      eq(field, value) { ctx._filters.push([field, value]); return api; },
      maybeSingle: async () => {
        const data = findRows(table, ctx)[0] || null;
        return { data, error: null };
      },
      update(payload) {
        ctx._payload = payload;
        return {
          eq: async (field, value) => {
            ctx._filters.push([field, value]);
            applyUpdate(table, ctx);
            return { data: null, error: null };
          }
        };
      },
      insert: async (payload) => {
        if (!state[table]) state[table] = [];
        state[table].push({ ...payload });
        return { data: payload, error: null };
      },
      upsert(payload) {
        ctx._upsertPayload = payload;
        return {
          select() {
            return {
              maybeSingle: async () => {
                const row = applyUpsert(table, payload);
                return { data: row, error: null };
              }
            };
          }
        };
      },
    };
    return api;
  }

  function findRows(table, ctx) {
    if (table === 'wallets') {
      const rows = Array.from(state.wallets.values());
      return rows.filter(row => ctx._filters.every(([k,v]) => row[k] === v));
    }
    if (table === 'orders') {
      const rows = Array.from(state.orders.values());
      return rows.filter(row => ctx._filters.every(([k,v]) => row[k] === v));
    }
    return [];
  }

  function applyUpdate(table, ctx) {
    if (table === 'wallets') {
      const rows = findRows(table, ctx);
      rows.forEach(row => Object.assign(row, ctx._payload));
      return;
    }
    if (table === 'orders') {
      const rows = findRows(table, ctx);
      rows.forEach(row => Object.assign(row, ctx._payload));
      return;
    }
  }

  function applyUpsert(table, payload) {
    if (table === 'wallets') {
      const existing = state.wallets.get(payload.user_id) || {};
      const next = { ...existing, ...payload };
      state.wallets.set(payload.user_id, next);
      return next;
    }
    return { ...payload };
  }

  return {
    state,
    from(table) {
      return tableApi(table);
    }
  };
}

export function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value) { this.body = value; },
    json() { return JSON.parse(this.body || '{}'); }
  };
}
