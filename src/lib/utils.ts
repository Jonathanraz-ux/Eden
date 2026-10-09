import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGuestDisplayName(guest: {
  first_name?: string | null;
  last_name?: string | null;
}): string {
  const first = (guest.first_name ?? '').trim();
  const last = (guest.last_name ?? '').trim();

  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return 'Client';
}

export function formatCents(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
