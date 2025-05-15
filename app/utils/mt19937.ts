/** Mersenne Twister implementation (MT19937) */
export class MT19937 {
  private mt: number[] = new Array(624)
  private index = 0

  constructor(seed: number) {
    this.seed(seed)
  }

  seed(seed: number) {
    this.mt[0] = seed >>> 0
    for (let i = 1; i < 624; i++) {
      this.mt[i] =
        (0x6c078965 * (this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)) + i) >>> 0
    }
    this.index = 624
  }

  private twist() {
    for (let i = 0; i < 624; i++) {
      const y =
        (this.mt[i] & 0x80000000) + (this.mt[(i + 1) % 624] & 0x7fffffff)
      this.mt[i] = this.mt[(i + 397) % 624] ^ (y >>> 1)
      if (y % 2 !== 0) {
        this.mt[i] ^= 0x9908b0df
      }
    }
    this.index = 0
  }

  // Returns a 32-bit unsigned integer
  int() {
    if (this.index >= 624) {
      this.twist()
    }
    let y = this.mt[this.index++]
    y ^= y >>> 11
    y ^= (y << 7) & 0x9d2c5680
    y ^= (y << 15) & 0xefc60000
    y ^= y >>> 18
    return y >>> 0
  }

  // Returns a float in [0, 1)
  random() {
    return this.int() / 0x100000000
  }
}
