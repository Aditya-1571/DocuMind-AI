"use client";

import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "doc-analyzer-theme";

export function HeaderMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
