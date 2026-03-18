/**
 * useAuthStateMachine.js — Auth lifecycle state machine
 *
 * DOCX tavsiyasi: Auth state machine kiriting:
 * idle → submitting → otp_sent → verifying → authenticated → hydrated → done
 *
 * Bu hook Auth.jsx va Register.jsx dagi tarqoq state'larni birlashtiradi.
 * Regressiya xavfini kamaytiradi — har bir holat aniq belgilangan.
 */
import { useCallback, useReducer } from 'react';

// ── Holatlar ─────────────────────────────────────────────────────────────────
export const AUTH_STATES = Object.freeze({
  IDLE:           'idle',
  SUBMITTING:     'submitting',      // telefon/parol yuborilmoqda
  OTP_SENT:       'otp_sent',        // OTP yuborildi, foydalanuvchi kiritmoqda
  VERIFYING:      'verifying',       // OTP tekshirilmoqda
  AUTHENTICATED:  'authenticated',   // JWT olindi
  HYDRATED:       'hydrated',        // profil yuklandi
  DONE:           'done',            // navigatsiya uchun tayyor
  ERROR:          'error',           // xato holati
});

// ── Harakatlar ────────────────────────────────────────────────────────────────
const ACTIONS = {
  SUBMIT:       'SUBMIT',
  OTP_SENT:     'OTP_SENT',
  VERIFY:       'VERIFY',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  HYDRATE_DONE: 'HYDRATE_DONE',
  COMPLETE:     'COMPLETE',
  FAIL:         'FAIL',
  RESET:        'RESET',
};

const INITIAL = {
  phase:  AUTH_STATES.IDLE,
  error:  null,
  phone:  null,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SUBMIT:
      return { ...state, phase: AUTH_STATES.SUBMITTING, error: null, phone: action.phone || state.phone };
    case ACTIONS.OTP_SENT:
      return { ...state, phase: AUTH_STATES.OTP_SENT, error: null };
    case ACTIONS.VERIFY:
      return { ...state, phase: AUTH_STATES.VERIFYING, error: null };
    case ACTIONS.AUTH_SUCCESS:
      return { ...state, phase: AUTH_STATES.AUTHENTICATED, error: null };
    case ACTIONS.HYDRATE_DONE:
      return { ...state, phase: AUTH_STATES.HYDRATED };
    case ACTIONS.COMPLETE:
      return { ...state, phase: AUTH_STATES.DONE };
    case ACTIONS.FAIL:
      return { ...state, phase: AUTH_STATES.ERROR, error: action.error || 'Xatolik' };
    case ACTIONS.RESET:
      return { ...INITIAL };
    default:
      return state;
  }
}

export function useAuthStateMachine() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const submit      = useCallback((phone) => dispatch({ type: ACTIONS.SUBMIT, phone }), []);
  const otpSent     = useCallback(()      => dispatch({ type: ACTIONS.OTP_SENT }), []);
  const verify      = useCallback(()      => dispatch({ type: ACTIONS.VERIFY }), []);
  const authSuccess = useCallback(()      => dispatch({ type: ACTIONS.AUTH_SUCCESS }), []);
  const hydrateDone = useCallback(()      => dispatch({ type: ACTIONS.HYDRATE_DONE }), []);
  const complete    = useCallback(()      => dispatch({ type: ACTIONS.COMPLETE }), []);
  const fail        = useCallback((err)   => dispatch({ type: ACTIONS.FAIL, error: err }), []);
  const reset       = useCallback(()      => dispatch({ type: ACTIONS.RESET }), []);

  return {
    phase:  state.phase,
    error:  state.error,
    phone:  state.phone,

    // Qulay boolean'lar
    isIdle:          state.phase === AUTH_STATES.IDLE,
    isLoading:       state.phase === AUTH_STATES.SUBMITTING || state.phase === AUTH_STATES.VERIFYING,
    isOtpPhase:      state.phase === AUTH_STATES.OTP_SENT,
    isAuthenticated: state.phase === AUTH_STATES.AUTHENTICATED || state.phase === AUTH_STATES.HYDRATED || state.phase === AUTH_STATES.DONE,
    isDone:          state.phase === AUTH_STATES.DONE,
    isError:         state.phase === AUTH_STATES.ERROR,

    // Harakatlar
    submit, otpSent, verify, authSuccess, hydrateDone, complete, fail, reset,
  };
}

export default useAuthStateMachine;
