/**
 * 骰子管理器 - 管理红色骰子与环石的消耗与获取
 * 简化为Web版（无限模式，无氪金系统）
 */

export class DiceManager {
  constructor() {
    // ===== 无限模式开关 =====
    this.infiniteRed = true;
    this.infiniteRing = true;

    // ===== 基础资源 =====
    this.redDice = 999999;
    this.ringStone = 0;
  }

  /**
   * 获取指定类型骰子数量
   * @param {string} type - "red" | "ring"
   * @returns {number} 数量（无限模式返回 Infinity）
   */
  getDiceCount(type = 'red') {
    if (type === 'red') {
      return this.infiniteRed ? Infinity : this.redDice;
    }
    if (type === 'ring') {
      return this.infiniteRing ? Infinity : this.ringStone;
    }
    return 0;
  }

  /**
   * 消耗骰子/环石
   * @param {number} count - 消耗数量
   * @param {string} type - "red" | "ring"
   * @returns {boolean} 是否成功
   */
  consumeDice(count, type = 'red') {
    if (type === 'red') {
      if (this.infiniteRed) return true;
      if (this.redDice >= count) {
        this.redDice -= count;
        return true;
      }
      return false;
    }
    if (type === 'ring') {
      if (this.infiniteRing) return true;
      if (this.ringStone >= count) {
        this.ringStone -= count;
        return true;
      }
      return false;
    }
    return false;
  }

  /**
   * 增加骰子/环石
   * @param {number} count - 增加数量
   * @param {string} type - "red" | "ring"
   */
  addDice(count, type = 'red') {
    if (type === 'red') {
      this.redDice += count;
    } else if (type === 'ring') {
      this.ringStone += count;
    }
  }

  /**
   * 判断是否能进行抽卡
   * @param {string} rollMode - "single" | "ten"
   * @param {string} type - "red" | "ring"
   * @returns {boolean}
   */
  canAffordRoll(rollMode = 'single', type = 'red') {
    const needed = rollMode === 'single' ? 1 : 10;

    if (type === 'red' && this.infiniteRed) return true;

    const current = this.getDiceCount(type);
    if (current >= needed) return true;

    // 红骰不足时尝试环石
    if (type === 'red' && !this.infiniteRing) {
      if (this.ringStone >= needed) return true;
    }

    return false;
  }

  /**
   * 尝试消耗进行抽取
   * 优先级: 红骰 > 环石
   * @param {number} count - 消耗数量
   * @returns {[boolean, string|null]} [成功, 消耗类型]
   */
  tryConsumeForRoll(count = 1) {
    if (this.consumeDice(count, 'red')) {
      return [true, 'red'];
    }
    if (this.consumeDice(count, 'ring')) {
      return [true, 'ring'];
    }
    return [false, null];
  }
}
