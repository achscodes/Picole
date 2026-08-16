import Image from "next/image";
import { cn } from "@/lib/format";

type BrandImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Square thumb, product card, or wide banner */
  variant?: "thumb" | "card" | "banner" | "sheet" | "cart";
};

const variantStyles = {
  thumb: "h-14 w-14 shrink-0 rounded-full p-1.5",
  cart: "h-20 w-20 shrink-0 rounded-2xl p-1.5",
  card: "aspect-[4/5] rounded-t-card p-3 sm:p-4",
  banner: "aspect-[16/9] min-h-[9rem] rounded-card p-4 sm:min-h-[11rem] sm:p-6",
  sheet: "aspect-[4/5] rounded-modal p-4 sm:p-6",
};

export function BrandImage({
  src,
  alt,
  className,
  imageClassName,
  sizes = "100vw",
  priority,
  variant = "card",
}: BrandImageProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-transparent",
        variantStyles[variant],
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-contain object-center", imageClassName)}
      />
    </div>
  );
}
