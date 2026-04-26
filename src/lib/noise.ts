import { createNoise2D } from 'simplex-noise'
import alea from 'alea'

/**
 * Creates a 2D noise function from a seed.
 * @param seed - The seed for the noise generator.
 * @returns A function that takes x and y coordinates and returns a noise value between -1 and 1.
 */
export function createNoise(seed: string) {
  const prng = alea(seed)
  const noise2D = createNoise2D(prng)
  return (x: number, y: number) => noise2D(x, y)
}
