import type { SVGProps } from "react";
export function Arrow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
      {...props}
    >
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 11h14a6 6 0 0 1 0 12H8m20-12H14a6 6 0 0 0 0 12h14"
        stroke="currentColor"
        strokeWidth="5"
      />
      <path d="M18 3v30" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}
