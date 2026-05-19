import Link from "next/link";

const links = [
  { href: "/feed", label: "Feed" },
  { href: "/explore", label: "Explore" },
  { href: "/projects", label: "Projects" },
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
];

export function MainNav() {
  return (
    <nav className="mt-4 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg border border-zinc-300 px-3 py-1 text-sm"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

