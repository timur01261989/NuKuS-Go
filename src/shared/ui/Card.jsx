import React from 'react';

export function Card({ className='', ...props }) {
  return <div className={['rounded-2xl border border-gray-200 bg-white shadow-sm', className].join(' ')} {...props} />;
}

export function CardHeader({ className='', ...props }) {
  return <div className={['p-4 border-b border-gray-100', className].join(' ')} {...props} />;
}

export function CardContent({ className='', ...props }) {
  return <div className={['p-4', className].join(' ')} {...props} />;
}
