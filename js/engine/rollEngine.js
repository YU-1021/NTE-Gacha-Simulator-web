/**
 * 掷骰与落格引擎
 */
import { CELL_TYPES, CELL_RATE_BOUNDS } from '../data/constants.js';
import { randomInt, randomFloat } from '../utils/random.js';

export class RollEngine {
  /**
   * 掷骰子，返回1~6的点数
   * @returns {number}
   */
  static rollDice() {
    return randomInt(1, 6);
  }

  /**
   * 根据概率分布决定落入哪种格子类型
   * 使用 CELL_RATE_BOUNDS 累积概率区间
   * @returns {string} 格子类型key
   */
  static determineCellType() {
    const r = randomFloat(0, 1);
    for (const [cellKey, start, end] of CELL_RATE_BOUNDS) {
      if (start <= r && r < end) {
        return cellKey;
      }
    }
    // 兜底：返回最后一个格子类型
    const keys = Object.keys(CELL_TYPES);
    return keys[keys.length - 1];
  }
}
