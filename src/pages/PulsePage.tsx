import type { User } from "../types";

// Full implementation in Day 5 — stub keeps the build green
export default function PulsePage(_: { user: User }) {
  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-5xl mb-3">💡</div>
        <p className="font-bold text-gray-900">Pulse wishlist</p>
        <p className="text-sm text-gray-500 mt-1">Coming in a moment…</p>
      </div>
    </div>
  );
}
