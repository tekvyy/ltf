import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  width?: number;
  height?: number;
}

/** Credelit brand mark — single-path coral glyph, inherits color via currentColor. */
export function CredelitMark({
  width = 32,
  height = 32,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 71 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M64.332 21.292C57.18 8.894 43.552 6.985 34.629 7.233 19.095 7.664 6.056 21.618 6.453 35.737c.188 6.701 1.026 12.529 3.43 17.844V31.707c0-.684.302-1.333.826-1.775l.005-.005L27.108 16.19l.003-.003a2.355 2.355 0 0 1 2.301-.416l9.401 3.212.02.006c1.687.62 2.073 2.82.695 3.97l-.006.005L23.92 35.88v24.132l7.914 3.028V39.677c0-.682.3-1.33.823-1.772L48.906 24.22l.004-.003a2.355 2.355 0 0 1 2.354-.401l17.593 6.547.012.005a2.322 2.322 0 0 1 1.492 2.164v25.261c0 1.647-1.66 2.753-3.183 2.173l-.013-.005-9.687-3.861a1.763 1.763 0 0 1-.988-2.298 1.781 1.781 0 0 1 2.312-.982l8.004 3.19V33.373l-16.138-6.006L35.39 40.235v24.559c0 1.616-1.615 2.741-3.143 2.19l-.017-.006-10.342-3.957a2.33 2.33 0 0 1-1.523-2.182V35.316c0-.688.306-1.341.836-1.784l.006-.005 14.385-11.91-6.71-2.292-15.444 12.942v24.651c0 2.023-2.52 3.182-4.02 1.59C3.794 52.538.26 44.61.014 35.835-.527 16.574 14.949.558 34.53.015c14.44-.402 27.115 7.719 32.998 19.73.43.877.063 1.935-.82 2.362-.882.427-1.888.031-2.376-.815Z"
      />
    </svg>
  );
}

export function Logo({ className, showText = false, width = 32, height = 32 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <CredelitMark width={width} height={height} />
      {showText && (
        <span className="text-xl font-semibold tracking-tight text-foreground">
          Credelit
        </span>
      )}
    </div>
  );
}
