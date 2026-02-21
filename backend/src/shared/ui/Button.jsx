import React from 'react';

export function Button({ variant='primary', size='md', className='', disabled, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };
  const variants = {
    primary: 'bg-black text-white hover:opacity-90',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:opacity-90',
    ghost: 'bg-transparent text-gray-900 hover:bg-gray-100',
  };
  return (
    <button
      className={[base, sizes[size] || sizes.md, variants[variant] || variants.primary, className].join(' ')}
      disabled={disabled}
      {...props}
    />
  );
}
