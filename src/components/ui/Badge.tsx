import { QuestionCategory } from "@/types";

type BadgeColor = "blue" | "green" | "purple" | "orange" | "gray";

const colorStyles: Record<BadgeColor, string> = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  purple: "bg-purple-50 text-purple-700",
  orange: "bg-orange-50 text-orange-700",
  gray: "bg-gray-100 text-gray-600",
};

const categoryColors: Record<QuestionCategory, BadgeColor> = {
  behavioral: "blue",
  "product-case": "purple",
  "role-specific": "orange",
};

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  category?: QuestionCategory;
}

export default function Badge({ children, color, category }: BadgeProps) {
  const resolvedColor = color ?? (category ? categoryColors[category] : "gray");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorStyles[resolvedColor]}`}
    >
      {children}
    </span>
  );
}
