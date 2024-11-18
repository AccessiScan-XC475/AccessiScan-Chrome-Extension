export function playConfetti() {
  confetti({
    particleCount: 100, // Number of confetti particles
    spread: 70, // Spread of the confetti
    origin: { x: 0.5, y: 0.5 }, // Origin of the confetti (center of the screen)
  });
}
