import {
  Sparkles, Palmtree, Car, UtensilsCrossed, Wifi, Dumbbell, Waves,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Palmtree,
  Car,
  UtensilsCrossed,
  Wifi,
  Dumbbell,
  Waves,
};

export function DynamicIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return null;
  const Icon = iconMap[name] ?? Sparkles;
  return <Icon className={className} />;
}
