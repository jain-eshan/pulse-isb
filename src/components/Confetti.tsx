import confetti from "canvas-confetti";

export function fireConfetti() {
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  setTimeout(
    () => confetti({ particleCount: 40, spread: 120, origin: { y: 0.7 } }),
    150
  );
}
