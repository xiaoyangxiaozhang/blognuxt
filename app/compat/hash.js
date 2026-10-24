import { fnv1a64 } from 'fnv1a-64'

// Preserve Nuxt's exact 64-bit cache keys without BigInt syntax or arithmetic.
// Each division operates on at most 36 * 2^32, safely below Number's 2^53 limit.
export function fnv1a64Base36(value) {
  let { high, low } = fnv1a64(value)
  let result = ''
  do {
    const highQuotient = Math.floor(high / 36)
    const remainder = (high - highQuotient * 36) * 0x100000000 + low
    const lowQuotient = Math.floor(remainder / 36)
    result = (remainder - lowQuotient * 36).toString(36) + result
    high = highQuotient
    low = lowQuotient
  } while (high || low)
  return result
}
