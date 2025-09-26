import React from 'react';
import { translateSpecialty as translateSpecialtyHelper } from '../utils/i18n';

// Reusable Badge component
// Props:
// - label: string (required)
// - variant: 'teal' | 'blue' | 'purple' | 'amber' | 'gray' | 'green' | 'red' (default: 'gray')
// - size: 'sm' | 'md' (default: 'sm')
// - icon: optional React node placed before the label
// - translateSpecialty: boolean (default: true) -> if true, translate known Turkish specialties to English
// - className: extra classes
// - rounded: 'md' | 'full' (default: 'md')

const variantClasses = {
  teal: 'bg-[#1C6A83] text-white border-[#1C6A83]',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200'
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1'
};

export default function Badge({
  label,
  variant = 'gray',
  size = 'sm',
  icon = null,
  translateSpecialty = true,
  className = '',
  rounded = 'md',
  ...rest
}) {
  const roundedCls = rounded === 'full' ? 'rounded-full' : 'rounded-md';
  const vCls = variantClasses[variant] || variantClasses.gray;
  const sCls = sizeClasses[size] || sizeClasses.sm;

  let finalLabel = label;
  if (translateSpecialty) {
    finalLabel = translateSpecialtyHelper(label);
  }

  return (
    <span
      className={`inline-flex items-center gap-1 border font-medium ${roundedCls} ${sCls} ${vCls} ${className}`}
      {...rest}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{finalLabel}</span>
    </span>
  );
}
