import React from "react";

const Splash: React.FC = () => (
  <div
    className="flex min-h-screen flex-col items-center justify-center px-6"
    style={{
      background: "#EEF1F8",
      fontFamily: '"Plus Jakarta Sans", sans-serif',
    }}
  >
    <div className="flex flex-col items-center gap-8 motion-page-enter">
      {/* App icon */}
      <div
        className="flex items-center justify-center rounded-[28px]"
        style={{
          width: 96,
          height: 96,
          background: "linear-gradient(145deg, #2D4A9E, #1B2B5E)",
          boxShadow: "0 12px 36px rgba(27,43,94,0.3)",
        }}
      >
        <svg width="64" height="64" viewBox="0 0 56 56" fill="none" aria-hidden>
          <path
            d="M10 4 H28 C42 4 52 14 52 28 C52 42 42 52 28 52 H10 Z"
            fill="rgba(255,255,255,0.1)"
          />
          <rect x="10" y="4" width="6" height="48" rx="3" fill="#F5A623" />
          <circle cx="32" cy="24" r="7" fill="#F5A623" />
          <path
            d="M28.5 30 L28.5 39 Q32 42 35.5 39 L35.5 30 Z"
            fill="#F5A623"
          />
          <circle cx="32" cy="24" r="3.5" fill="#1B2B5E" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="text-center">
        <div
          style={{
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: "-0.02em",
            color: "#1B2B5E",
            lineHeight: 1,
          }}
        >
          dom<span style={{ color: "#F5A623" }}>vio</span>
        </div>
        <p className="mt-2 text-sm font-medium" style={{ color: "#8A9AB8" }}>
          Your home, managed.
        </p>
      </div>

      {/* Loading indicator */}
      <div className="w-48 flex flex-col items-center gap-2">
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(27,43,94,0.1)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: "100%",
              background: "linear-gradient(90deg, #F5A623, #E8920F)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "#8A9AB8" }}
        >
          Initialising…
        </p>
      </div>
    </div>
  </div>
);

export default Splash;
