import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSkeleton({ message = 'Loading configuration...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-100">
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

export function inputClass(extra = '') {
  return `w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white ${extra}`;
}

export function btnPrimary(disabled = false) {
  return `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm`;
}

export function btnSecondary() {
  return `inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition`;
}

export function idOf(ref: string | { _id?: string } | null | undefined): string {
  if (!ref) return '';
  return typeof ref === 'string' ? ref : ref._id || '';
}
