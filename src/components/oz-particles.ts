export function createOzParticles(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const t = index / count;
    const angle = index * 2.399963229728653;
    const thickness = Math.sin(index * 1.73) * 17;
    let x: number;
    let y: number;
    let z: number;
    if (t < 0.55) {
      const ring = (t / 0.55) * Math.PI * 2;
      x = -98 + (74 + thickness) * Math.cos(ring);
      y = (80 + thickness) * Math.sin(ring);
      z = Math.cos(index * 1.73) * 22;
    } else {
      const progress = (t - 0.55) / 0.45;
      if (progress < 0.24) {
        x = 38 + (progress / 0.24) * 117;
        y = -72;
      } else if (progress < 0.32) {
        const u = (progress - 0.24) / 0.08;
        x = (1 - u) ** 2 * 155 + 2 * (1 - u) * u * 180 + u ** 2 * 163;
        y = -72 + u ** 2 * 18;
      } else if (progress < 0.68) {
        const u = (progress - 0.32) / 0.36;
        x = 163 - u * 110;
        y = -54 + u * 108;
      } else if (progress < 0.76) {
        const u = (progress - 0.68) / 0.08;
        x = (1 - u) ** 2 * 53 + 2 * (1 - u) * u * 28 + u ** 2 * 53;
        y = 54 + 2 * (1 - u) * u * 18 + u ** 2 * 18;
      } else {
        x = 53 + ((progress - 0.76) / 0.24) * 123;
        y = 72;
      }
      x += Math.sin(angle) * 15;
      y += Math.cos(angle) * 15;
      z = thickness;
    }
    const latitude = Math.acos(1 - 2 * ((index + 0.5) / count));
    return {
      x: x + (t < 0.55 ? 8 : -8),
      y,
      z,
      sphereX: Math.cos(angle) * Math.sin(latitude) * 166,
      sphereY: Math.sin(angle) * Math.sin(latitude) * 166,
      sphereZ: Math.cos(latitude) * 166,
      size: 0.55 + ((index * 37) % 100) / 100,
    };
  });
}
