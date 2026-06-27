import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const size = Math.min(512, Math.max(16, Number(searchParams.get("size") ?? 192)));
  const r = Math.round(size * 0.22); // iOS-style corner radius

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "#080808",
          borderRadius: r,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Fork tines */}
        <svg
          width={size * 0.48}
          height={size * 0.48}
          viewBox="0 0 48 48"
          fill="none"
        >
          {/* Left fork */}
          <rect x="7" y="4" width="2.5" height="16" rx="1.25" fill="white" opacity="0.9" />
          <rect x="13" y="4" width="2.5" height="16" rx="1.25" fill="white" opacity="0.9" />
          <rect x="19" y="4" width="2.5" height="16" rx="1.25" fill="white" opacity="0.9" />
          <rect x="7" y="20" width="14.5" height="2.5" rx="1.25" fill="white" opacity="0.9" />
          <rect x="13.25" y="22.5" width="2.5" height="22" rx="1.25" fill="white" opacity="0.9" />
          {/* Right knife */}
          <path
            d="M31 4 C31 4 38 10 38 20 C38 22 36.5 23 35 23 L33.5 23 L33.5 44.5 C33.5 45.3 32.8 46 32 46 L30.5 46 C29.7 46 29 45.3 29 44.5 L29 4 Z"
            fill="white"
            opacity="0.9"
          />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
