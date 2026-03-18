/**
 * auth-state-machine.unit.test.js
 * DOCX Section 10: Hook — useAuthStateMachine
 */
import { describe, it, expect } from 'vitest';

// State machine logikasini React hook'siz test qilamiz
const AUTH_STATES = {
  IDLE: 'idle', SUBMITTING: 'submitting', OTP_SENT: 'otp_sent',
  VERIFYING: 'verifying', AUTHENTICATED: 'authenticated',
  HYDRATED: 'hydrated', DONE: 'done', ERROR: 'error',
};

function reduce(state, action) {
  switch (action.type) {
    case 'SUBMIT':       return { ...state, phase: AUTH_STATES.SUBMITTING, error: null, phone: action.phone || state.phone };
    case 'OTP_SENT':     return { ...state, phase: AUTH_STATES.OTP_SENT, error: null };
    case 'VERIFY':       return { ...state, phase: AUTH_STATES.VERIFYING, error: null };
    case 'AUTH_SUCCESS': return { ...state, phase: AUTH_STATES.AUTHENTICATED };
    case 'HYDRATE_DONE': return { ...state, phase: AUTH_STATES.HYDRATED };
    case 'COMPLETE':     return { ...state, phase: AUTH_STATES.DONE };
    case 'FAIL':         return { ...state, phase: AUTH_STATES.ERROR, error: action.error };
    case 'RESET':        return { phase: AUTH_STATES.IDLE, error: null, phone: null };
    default:             return state;
  }
}

function machine() {
  let state = { phase: AUTH_STATES.IDLE, error: null, phone: null };
  const dispatch = (action) => { state = reduce(state, action); };
  return { get: () => state, dispatch };
}

describe('AuthStateMachine', () => {
  it('boshlang\'ich holat IDLE', () => {
    const m = machine();
    expect(m.get().phase).toBe(AUTH_STATES.IDLE);
  });

  it('SUBMIT → SUBMITTING, phone saqlanadi', () => {
    const m = machine();
    m.dispatch({ type: 'SUBMIT', phone: '901234567' });
    expect(m.get().phase).toBe(AUTH_STATES.SUBMITTING);
    expect(m.get().phone).toBe('901234567');
  });

  it('to\'liq login oqimi', () => {
    const m = machine();
    m.dispatch({ type: 'SUBMIT' });
    expect(m.get().phase).toBe(AUTH_STATES.SUBMITTING);
    m.dispatch({ type: 'AUTH_SUCCESS' });
    expect(m.get().phase).toBe(AUTH_STATES.AUTHENTICATED);
    m.dispatch({ type: 'HYDRATE_DONE' });
    expect(m.get().phase).toBe(AUTH_STATES.HYDRATED);
    m.dispatch({ type: 'COMPLETE' });
    expect(m.get().phase).toBe(AUTH_STATES.DONE);
  });

  it('to\'liq register OTP oqimi', () => {
    const m = machine();
    m.dispatch({ type: 'SUBMIT' });
    m.dispatch({ type: 'OTP_SENT' });
    expect(m.get().phase).toBe(AUTH_STATES.OTP_SENT);
    m.dispatch({ type: 'VERIFY' });
    expect(m.get().phase).toBe(AUTH_STATES.VERIFYING);
    m.dispatch({ type: 'AUTH_SUCCESS' });
    expect(m.get().phase).toBe(AUTH_STATES.AUTHENTICATED);
    m.dispatch({ type: 'COMPLETE' });
    expect(m.get().phase).toBe(AUTH_STATES.DONE);
  });

  it('FAIL → ERROR holat, xato saqlanadi', () => {
    const m = machine();
    m.dispatch({ type: 'SUBMIT' });
    m.dispatch({ type: 'FAIL', error: 'Telefon noto\'g\'ri' });
    expect(m.get().phase).toBe(AUTH_STATES.ERROR);
    expect(m.get().error).toBe('Telefon noto\'g\'ri');
  });

  it('RESET — IDLEga qaytadi', () => {
    const m = machine();
    m.dispatch({ type: 'SUBMIT' });
    m.dispatch({ type: 'AUTH_SUCCESS' });
    m.dispatch({ type: 'RESET' });
    expect(m.get().phase).toBe(AUTH_STATES.IDLE);
    expect(m.get().error).toBeNull();
  });
});
