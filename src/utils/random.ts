/**
 * Random Utils
 * @module
 */

/**
 * Weighted random
 * @param weights Weights
 * @returns index
 */
export const weightedRandom = (weights: number[]): number => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const random = Math.random() * totalWeight
  let cumulativeWeight = 0

  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i]
    if (random < cumulativeWeight) {
      return i
    }
  }
  return 0
}
