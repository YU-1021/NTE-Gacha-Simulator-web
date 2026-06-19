/**
 * 游戏状态管理器 - 管理所有游戏运行时状态
 */
import { PITY_CONFIG, SKIN_TYPE_KEYS } from '../data/constants.js';
import { DiceManager } from './diceManager.js';

export class GameState {
  constructor() {
    this.diceManager = new DiceManager();
    this.reset();
  }

  /**
   * 重置所有游戏状态
   */
  reset() {
    this.totalRolls = 0;
    this.sPityCounter = 0;
    this.giftCounter = 0;
    this.isVariant = false;
    this.goldChips = 0;
    this.whiteChips = 0;
    this.collection = {
      s_characters: {},
      a_characters: {},
      a_disks: {},
      b_disks: {},
      skins: {},
    };
    this.sleepPoolActive = false;
    this.rollHistory = [];
    // 皮肤累计领取记录: {skin_type_key: bool}
    this.skinClaimed = {};
    for (const stype of SKIN_TYPE_KEYS) {
      this.skinClaimed[stype] = false;
    }
  }

  /**
   * 将获得物品加入收集记录
   * @param {string} itemType - 收集分类 (s_characters / a_characters / a_disks / b_disks / skins)
   * @param {string} itemName - 物品名称
   * @returns {[boolean, number]} [是否为重复, 当前总次数]
   */
  addToCollection(itemType, itemName) {
    const col = this.collection[itemType];
    if (itemName in col) {
      col[itemName] += 1;
      return [true, col[itemName]];
    } else {
      col[itemName] = 1;
      return [false, 1];
    }
  }

  /**
   * 获取物品已获得次数
   * @param {string} itemType
   * @param {string} itemName
   * @returns {number}
   */
  getItemCount(itemType, itemName) {
    const col = this.collection[itemType];
    return col ? (col[itemName] || 0) : 0;
  }

  /**
   * 增加S级保底计数，检查是否触发变格或硬保底
   * @returns {null|"variant"|"hard_pity"}
   */
  incrementSPity() {
    this.sPityCounter += 1;
    const pityCfg = PITY_CONFIG.s_pity;
    if (this.sPityCounter >= pityCfg.variant_threshold && !this.isVariant) {
      this.isVariant = true;
      return 'variant';
    }
    if (this.sPityCounter >= pityCfg.hard_pity) {
      return 'hard_pity';
    }
    return null;
  }

  /**
   * 获得S级角色后重置保底计数和变格状态
   */
  resetSPity() {
    this.sPityCounter = 0;
    this.isVariant = false;
  }

  /**
   * 检查集点赠礼，每10次触发一次
   * @returns {boolean}
   */
  checkGift() {
    const cfg = PITY_CONFIG.gift_pity;
    this.giftCounter += 1;
    if (this.giftCounter >= cfg.interval) {
      this.giftCounter = 0;
      return true;
    }
    return false;
  }
}
