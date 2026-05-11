"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, Shirt, Sparkles, WashingMachine, History, UserCircle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Add Clothes", href: "/dashboard/upload", icon: Upload },
  { name: "My Clothes", href: "/dashboard/wardrobe", icon: Shirt },
  { name: "Laundry", href: "/dashboard/laundry", icon: WashingMachine },
  { name: "Generate Outfit", href: "/dashboard/outfits", icon: Sparkles },
  { name: "Saved Outfits", href: "/dashboard/history", icon: History },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-background/80 backdrop-blur-xl border-r border-border-color flex flex-col pt-8 pb-4 px-4 hidden md:flex z-40 transition-colors duration-300">
      <div className="mb-8 w-[calc(100%+2rem)] -mx-4 flex justify-center items-center">
        <Link href="/dashboard" className="flex items-center justify-center w-full h-full">
          <img src="/logo.png" alt="DripCheck Logo" className="w-full h-auto object-contain" />
        </Link>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                ? "bg-text-primary text-background font-semibold shadow-md"
                : "text-text-secondary hover:bg-background/5 dark:hover:bg-text-primary/10 hover:text-text-primary"
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2 pt-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
