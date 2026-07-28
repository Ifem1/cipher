"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STOPS = [
  { href: "/", label: "Observatory", short: "OBS" },
  { href: "/subjects/new", label: "New Circuit", short: "NEW" },
  { href: "/profile", label: "Profile", short: "PROF" },
];

export function OrbitalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed",
        top: 44,
        left: 0,
        bottom: 0,
        width: 88,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 0",
        background: "rgba(8,8,20,0.92)",
        backdropFilter: "blur(12px)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Vertical trace line */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1,
        height: "60%",
        background: "linear-gradient(to bottom, transparent, var(--border) 30%, var(--border) 70%, transparent)",
        zIndex: 0,
      }}/>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
        {STOPS.map((stop) => {
          const active = pathname === stop.href || (stop.href !== "/" && pathname.startsWith(stop.href));
          return (
            <Link
              key={stop.href}
              href={stop.href}
              aria-current={active ? "page" : undefined}
              aria-label={stop.label}
              title={stop.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                transition: "opacity 0.2s",
                opacity: active ? 1 : 0.45,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = active ? "1" : "0.45")}
            >
              {/* Node circle */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: `${active ? 2 : 1}px solid ${active ? "var(--confirmed)" : "var(--border)"}`,
                background: active ? "rgba(0,255,179,0.08)" : "var(--deep)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "border-color 0.2s, background 0.2s",
              }}>
                {/* Inner dot */}
                <div style={{
                  width: active ? 8 : 5,
                  height: active ? 8 : 5,
                  borderRadius: "50%",
                  background: active ? "var(--confirmed)" : "var(--muted)",
                  transition: "all 0.2s var(--ease-surge)",
                }}/>
                {/* Active indicator — left-edge bar */}
                {active && (
                  <div style={{
                    position: "absolute",
                    left: -13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 16,
                    background: "var(--confirmed)",
                    borderRadius: "0 2px 2px 0",
                  }}/>
                )}
              </div>

              {/* Label */}
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: active ? "var(--confirmed)" : "var(--muted)",
                transition: "color 0.2s",
                lineHeight: 1,
              }}>
                {stop.short}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
