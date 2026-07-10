import { MoonMark, XIcon } from "./icons";

const linkGroups = [
  { label: "X", href: "https://x.com", external: true },
  { label: "Docs", href: "#", external: false },
  { label: "GitHub", href: "https://github.com", external: true },
  { label: "Terms", href: "#", external: false },
  { label: "Privacy", href: "#", external: false },
];

export function Footer() {
  return (
    <footer className="border-t border-edge bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-foreground">
            <MoonMark />
            <span className="text-sm font-semibold tracking-[0.18em]">
              HOODMOON
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Community token for Robinhood Chain.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {linkGroups.map(({ label, href, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-300 hover:text-foreground"
                >
                  {label === "X" ? <XIcon /> : label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-edge">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HoodMoon. All rights reserved.</p>
          <p>
            Not investment advice. HoodMoon is an independent community project
            and is not affiliated with or endorsed by Robinhood.
          </p>
        </div>
      </div>
    </footer>
  );
}
