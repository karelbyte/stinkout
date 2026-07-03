"use client";

import { IoIosCafe } from "react-icons/io";

export default function FloatingCoffee() {
  return (
    <a
      href="https://buymeacoffee.com/stinkout"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-3 sm:right-4 bottom-24 sm:top-1/2 sm:-translate-y-1/2 z-50 flex items-center justify-center rounded-full border border-amber-700/30 bg-amber-950/40 w-8 h-8 text-amber-400 backdrop-blur-sm transition-all hover:border-amber-600 hover:bg-amber-900/40 hover:text-amber-300 animate-pulse-subtle"
      title="Buy me a coffee"
    >
      <IoIosCafe className="animate-bounce-subtle" size={20} />
    </a>
  );
}
