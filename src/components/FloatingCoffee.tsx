"use client";

import { IoIosCafe } from "react-icons/io";

export default function FloatingCoffee() {
  return (
    <a
      href="https://buymeacoffee.com/stinkout"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center rounded-full border border-amber-700/40 bg-amber-950/30 p-3 text-amber-400 transition-all hover:border-amber-600 hover:bg-amber-900/40 hover:text-amber-300 hover:scale-110 animate-pulse-subtle"
      title="Buy me a coffee"
    >
      <IoIosCafe className="animate-bounce-subtle" size={24} />
    </a>
  );
}
