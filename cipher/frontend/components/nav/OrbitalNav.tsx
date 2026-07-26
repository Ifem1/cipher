"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STOPS = [
  { href: "/", label: "Observatory", icon: "◉" },
  { href: "/subjects/new", label: "New Circuit", icon: "⊕" },
  { href: "/profile", label: "Profile", icon: "◈" },
];

export function OrbitalNav() {
  const pathname = usePathname();
  return (
    <nav
      className="orbital-nav"
      aria-label="Main navigation"
      role="navigation"
    >
      <div
        style={{
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        <div
          style={{
            paddingLeft: 12,
            paddingBottom: 20,
            fontFamily: "var(--font-display)",
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "var(--confirmed)",
            textTransform: "uppercase",
          }}
        >
          CIPHER
        </div>

        {STOPS.map((stop) => {
          const active = pathname === stop.href;
          return (
            <Link
              key={stop.href}
              href={stop.href}
              className="orbital-stop"
              data-active={active}
              aria-current={active ? "page" : undefined}
              style={{
                borderLeftColor: active ? "var(--confirmed)" : "transparent",
                background: active ? "rgba(0,255,179,0.04)" : undefined,
                color: active ? "var(--text)" : "var(--muted)",
              }}
            >
              <span
                className="orbital-stop-dot"
                style={{
                  background: active ? "var(--confirmed)" : "currentColor",
                }}
                aria-hidden="true"
              />
              <span className="orbital-stop-label">{stop.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
