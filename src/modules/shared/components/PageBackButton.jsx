import React from 'react';
import { useNavigate } from 'react-router-dom';
import { safeBack } from '@/modules/shared/navigation/safeBack';

export default function PageBackButton({ fallback = '/', className = '', iconClassName = '' }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={className || 'h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95'}
      onClick={() => safeBack(navigate, fallback)}
    >
      <span className={iconClassName || 'material-symbols-rounded'} translate="no" aria-hidden="true" data-no-auto-translate="true">arrow_back</span>
    </button>
  );
}
