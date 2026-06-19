/**
 * 抽卡判定引擎 - 处理S级/A级/B级/弧盘/皮肤的抽签判定
 */
import {
  CELL_TYPES,
  PITY_CONFIG,
  DUPLICATE_RULES,
  A_DISK_POOL,
  B_DISK_POOL,
} from '../data/constants.js';
import {
  getSPool,
  getAPool,
  getSkinCharacter,
  getSkinSystem,
  getCompanionsList,
  getBoardRules,
} from '../utils/helpers.js';
import { randomFloat, randomChoice } from '../utils/random.js';

export class GachaEngine {
  /**
   * @param {import('./gameState.js').GameState} state
   * @param {string} boardId - 棋盘ID
   */
  constructor(state, boardId = 'limited_xun') {
    this.state = state;
    this.boardId = boardId;
    this.loadBoardRewards(boardId);
  }

  /**
   * 加载指定棋盘的奖励池数据和规则配置
   * @param {string} boardId
   */
  loadBoardRewards(boardId) {
    this.boardId = boardId;
    this.sPool = getSPool(boardId);
    this.aPool = getAPool(boardId);
    this.companionsList = getCompanionsList(boardId);
    this.skinChar = getSkinCharacter(boardId);
    this.skinSystem = getSkinSystem(boardId);
    this.rules = getBoardRules(boardId);
  }

  /**
   * 切换到新棋盘（重新加载所有奖励池）
   * @param {string} newBoardId
   */
  switchBoard(newBoardId) {
    if (newBoardId !== this.boardId) {
      this.loadBoardRewards(newBoardId);
    }
  }

  /**
   * S级角色抽签判定
   * @returns {[boolean, string|null, string|null]} [是否获得, 角色名, 获得原因]
   */
  gachaSCharacter() {
    // 优先使用动态规则
    const rules = this.rules;
    const pityHard = rules.s_pity_hard || 90;
    const baseRateVariant = rules.s_base_rate_variant || 0.1959;
    const baseRateNormal = rules.s_base_rate_normal || 0.0099;

    // 硬保底判定
    if (this.state.sPityCounter >= pityHard - 1) {
      const charName = this.sPool[0].name;
      this.state.resetSPity();
      return [true, charName, '硬保底'];
    }

    // 变格/基准概率判定
    const baseRate = this.state.isVariant ? baseRateVariant : baseRateNormal;
    if (randomFloat(0, 1) < baseRate) {
      const charName = this.sPool[0].name;
      this.state.resetSPity();
      return [true, charName, this.state.isVariant ? '变格' : '常规'];
    }

    return [false, null, null];
  }

  /**
   * 集点赠礼中的A级角色抽取（仅从非gift_only的角色中抽取）
   * @returns {string} 角色名
   */
  gachaACharacterFromGift() {
    const eligible = this.aPool.filter(c => !c.gift_only);
    const totalRate = eligible.reduce((sum, c) => sum + c.rate, 0);
    const r = randomFloat(0, 1) * totalRate;
    let cumulative = 0;
    for (const char of eligible) {
      cumulative += char.rate;
      if (r < cumulative) {
        return char.name;
      }
    }
    return eligible[eligible.length - 1].name;
  }

  /**
   * 随机获得一个A级弧盘
   * @returns {string}
   */
  gachaADisk() {
    return randomChoice(A_DISK_POOL);
  }

  /**
   * 随机获得一个B级弧盘
   * @returns {string}
   */
  gachaBDisk() {
    return randomChoice(B_DISK_POOL);
  }

  /**
   * 于此同行格子判定
   * @returns {[string, string]} [角色名, 品阶]
   */
  gachaCompanion() {
    const cell = CELL_TYPES.companion;
    const subRates = cell.sub_rates;
    const r = randomFloat(0, 1);
    if (r < subRates.s_character) {
      const sCompanions = this.companionsList.filter(c => c.rank === 'S');
      const companion = randomChoice(sCompanions);
      return [companion.name, 'S'];
    } else {
      const aCompanions = this.companionsList.filter(c => c.rank === 'A');
      const companion = randomChoice(aCompanions);
      return [companion.name, 'A'];
    }
  }

  /**
   * 集点赠礼判定
   * @returns {[string, string]} [类型, 名称]
   */
  gachaGift() {
    const cfg = PITY_CONFIG.gift_pity;
    const r = randomFloat(0, 1);
    if (r < cfg.a_character_rate) {
      const name = this.gachaACharacterFromGift();
      return ['a_character', name];
    } else {
      const name = this.gachaADisk();
      return ['a_disk', name];
    }
  }

  /**
   * 装扮礼遇皮肤抽取
   * @param {string} skinTypeKey - 皮肤类型key (today_outfit / vehicle_paint / glider_skin)
   * @returns {[string, string]} [皮肤完整名称, 皮肤类型key]
   */
  gachaSkin(skinTypeKey) {
    const cfg = this.skinSystem[skinTypeKey];
    const skinsDict = cfg.skins;
    const skinKeys = Object.keys(skinsDict);
    const charName = randomChoice(skinKeys);
    const skinFullName = skinsDict[charName];
    return [skinFullName, skinTypeKey];
  }

  /**
   * 计算重复获得补偿
   * @param {string} itemType - 物品类型 (s_character / a_character / a_disk / b_disk)
   * @param {string} itemName - 物品名称
   * @param {number} count - 当前总获得次数（含本次）
   * @returns {{fragment: number, gold_chip: number, white_chip: number}}
   */
  calculateDuplicateReward(itemType, itemName, count) {
    const reward = { fragment: 0, gold_chip: 0, white_chip: 0 };
    // skin类型：itemType形如 "skin_today_outfit"，先查精确key，再fallback到"skin"
    let rules;
    if (itemType.startsWith('skin_')) {
      rules = DUPLICATE_RULES[itemType] || DUPLICATE_RULES['skin'];
    } else {
      rules = DUPLICATE_RULES[itemType];
    }
    if (!rules) return reward;

    if (itemType === 's_character' || itemType === 'a_character') {
      if (count >= 2 && count <= 7) {
        const rule = rules.range_2_7 || {};
        reward.fragment = rule.fragment || 0;
        reward.gold_chip = rule.gold_chip || 0;
      } else if (count >= 8) {
        const rule = rules.range_8_plus || {};
        reward.gold_chip = rule.gold_chip || 0;
      }
    } else if (itemType === 'a_disk') {
      reward.gold_chip = rules.extra_gold_chip || 0;
    } else if (itemType === 'b_disk') {
      reward.white_chip = rules.extra_white_chip || 0;
    } else if (itemType.startsWith('skin_')) {
      reward.gold_chip = rules.gold_chip || 0;
    }

    return reward;
  }
}
