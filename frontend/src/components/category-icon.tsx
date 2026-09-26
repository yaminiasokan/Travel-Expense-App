import {
  Utensils,
  Bed,
  Fuel,
  Plane,
  TrainFront,
  Bus,
  CarTaxiFront,
  ShoppingBag,
  Stethoscope,
  Ticket,
  MoreHorizontal,
  Tag,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  bed: Bed,
  fuel: Fuel,
  plane: Plane,
  "train-front": TrainFront,
  bus: Bus,
  "car-taxi-front": CarTaxiFront,
  "shopping-bag": ShoppingBag,
  stethoscope: Stethoscope,
  ticket: Ticket,
  "more-horizontal": MoreHorizontal,
};

export function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon && ICON_MAP[icon]) || Tag;
  return <Icon className={className} />;
}
