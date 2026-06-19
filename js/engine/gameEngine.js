/**
 * 主游戏引擎 - 编排所有子引擎，处理单次掷骰的完整流程
 */
import { CELL_TYPES, SKIN_TYPE_KEYS, DUPLICATE_RULES, SLEEP_POOL_CONFIG } from '../data/constants.js';
import { BOARDS_REGISTRY } from '../data/boardData.js';
import { getCellTypeFromName, parseMistBoxAmount, parseCompanionName } from '../utils/helpers.js';
import { GameState } from './gameState.js';
import { GachaEngine } from './gachaEngine.js';
import { SleepPoolEngine } from './sleepPoolEngine.js';
import { RollEngine } from './rollEngine.js';
import { randomFloat, randomChoice } from '../utils/random.js';

export class GameEngine {
  constructor(boardId = 'limited_xun') {
    this.state = new GameState();
    this.gacha = new GachaEngine(this.state, boardId);
    this.sleepPool = new SleepPoolEngine();
    this.rollEngine = RollEngine;
    this.inBranch = null;
    this.branchStep = 0;
    this.currentBoardId = boardId;
  }

  switchBoard(newBoardId) {
    this.gacha.switchBoard(newBoardId);
    this.currentBoardId = newBoardId;
  }

  /**
   * 执行一次完整的掷骰流程
   * @param {Object} params
   * @param {number} params.currentPosIdx - 当前位置索引（落点，骰子移动后的目标位置）
   * @param {number} [params.diceValue] - 预先掷好的骰子值（由外部传入，避免重复掷骰）
   * @param {string} [params.cellType] - 格子类型key（可选，不传则自动判定）
   * @param {string} [params.cellName] - 落点格子中文名
   * @param {Object} [params.branchEntries] - 分支入口配置
   * @param {string} [params.isInBranch] - 当前是否在分支中
   * @param {number} [params.branchStep=0] - 分支步数
   * @param {number} [params.fromPosIdx] - 掷骰前的位置（用于计算移动距离）
   * @returns {Object} 结果对象
   */
  executeSingleRoll({ currentPosIdx = 0, diceValue: inputDice, cellType, cellName, branchEntries, isInBranch, branchStep = 0, fromPosIdx }) {
    // 1. 掷骰（优先使用外部传入的骰子值）
    const diceValue = (inputDice != null) ? inputDice : this.rollEngine.rollDice();

    // 2. 总掷骰次数+1
    this.state.totalRolls++;

    // 3. 检查皮肤累计领取
    const claimRewards = this._checkSkinClaims();

    // 4. 确定格子类型
    if (!cellType) {
      cellType = cellName ? getCellTypeFromName(cellName) : this.rollEngine.determineCellType();
    }

    // 5. 检测分支入口
    let branchEvent = null;
    if (branchEntries && !isInBranch && !this.inBranch) {
      for (const [branchName, entry] of Object.entries(branchEntries)) {
        if (currentPosIdx === entry.entry_main_idx) {
          this.inBranch = branchName;
          this.branchStep = 0;
          branchEvent = { type: 'enter_branch', branch: branchName };
          break;
        }
      }
    }

    // 6. 分支内同行格子特殊处理
    if (isInBranch === 's_character_zone' && cellType === 'companion') {
      branchEvent = { type: 's_got' };
    }

    // 7. 解析格子效果
    const rewards = [];
    let pityEvent = null;
    let giftResult = null;
    let sleepPoolEvent = null;
    let diceGained = 0;

    switch (cellType) {
      case 'apprentice_chest':
        this._resolveApprenticeChestDarkbox(rewards);
        break;
      case 'brave_chest':
        this._resolveBraveChestDarkbox(rewards);
        break;
      case 'companion':
        this._resolveCompanionDarkbox(cellName, rewards);
        break;
      case 'mist_box':
        this._resolveMistBox(cellName, rewards);
        break;
      case 'arcade_blind':
        this._resolveArcadeBlindSleep(rewards);
        break;
      case 'arcade_blind_sleep':
        this._resolveArcadeBlindSleep(rewards);
        break;
      case 'roll_again':
        rewards.push({ type: 'dice', name: '+1骰子' });
        diceGained += 1;
        break;
      case 'multi_surprise':
        rewards.push({ type: 'dice', name: '+5骰子' });
        diceGained += 5;
        break;
      case 'today_outfit':
      case 'vehicle_paint':
      case 'glider_skin':
        this._resolveSkinCellDarkbox(cellType, rewards);
        break;
    }

    // 8. S级保底计数（仅当本轮未获得S角色时才递增）
    const hasSCharacter = rewards.some(r => r.type === 's_character');
    if (hasSCharacter) {
      // 本轮已获得S角色（来自格子效果），重置保底
      this.state.resetSPity();
      pityEvent = null;
    } else {
      pityEvent = this.state.incrementSPity();

      // 9. 保底触发且本轮没有S角色时，强制出S
      if (pityEvent === 'variant' || pityEvent === 'hard_pity') {
        const [got, charName, reason] = this.gacha.gachaSCharacter();
        if (got) {
          this._addSCharacterReward(charName, reason, rewards);
        }
      }
    }

    // 10. 集点赠礼检查
    if (this.state.checkGift()) {
      const [giftType, giftName] = this.gacha.gachaGift();
      giftResult = { type: giftType, name: giftName };
      if (giftType === 'a_character') {
        this._addACharacterReward(giftName, '集点赠礼', rewards);
      } else if (giftType === 'a_disk') {
        this._addADiskReward(giftName, '集点赠礼', rewards);
      }
    }

    // 将皮肤领取奖励合并到rewards
    for (const cr of claimRewards) {
      rewards.push(cr);
    }

    // 计算新的位置索引
    const newPositionIdx = currentPosIdx + diceValue;

    // 保存分支状态
    let newBranchState = this.inBranch;
    let newBranchStep = this.branchStep;
    if (isInBranch) {
      newBranchStep = branchStep + 1;
    }

    // 11. 保存到历史记录
    const result = {
      rollNumber: this.state.totalRolls,
      diceValue,
      cellType,
      cellName: cellName || (CELL_TYPES[cellType] ? CELL_TYPES[cellType].name : cellType),
      rewards,
      pityEvent,
      giftResult,
      sleepPoolEvent,
      diceGained,
      branchEvent,
      newPositionIdx,
      newBranchState,
      newBranchStep,
    };
    this.state.rollHistory.push(result);

    return result;
  }

  // ======================== 私有方法 ========================

  /**
   * 学徒宝箱暗箱：0.2%概率S级角色，否则B级弧盘
   */
  _resolveApprenticeChestDarkbox(rewards) {
    const sRate = (this.gacha.rules.chest_s_rate || {}).apprentice_normal || 0.002;
    if (randomFloat(0, 1) < sRate) {
      const [got, charName, reason] = this.gacha.gachaSCharacter();
      if (got) {
        this._addSCharacterReward(charName, '学徒宝箱', rewards);
      }
    } else {
      this._addBDiskReward(rewards);
    }
  }

  /**
   * 勇者宝箱暗箱：变格60%S / 20%A盘 / 20%B盘；常规3%S / 97%B盘。最后加金棋子
   */
  _resolveBraveChestDarkbox(rewards) {
    const rates = this.gacha.rules.chest_s_rate || {};
    const isVariant = this.state.isVariant;
    const sRate = isVariant ? (rates.brave_variant || 0.60) : (rates.brave_normal || 0.03);

    const r = randomFloat(0, 1);
    if (r < sRate) {
      const [got, charName, reason] = this.gacha.gachaSCharacter();
      if (got) {
        this._addSCharacterReward(charName, '勇者宝箱', rewards);
      }
    } else if (isVariant && r < sRate + 0.20) {
      this._addADiskReward(this.gacha.gachaADisk(), '勇者宝箱', rewards);
    } else {
      this._addBDiskReward(rewards);
    }

    // 勇者宝箱固定给2金棋子
    const goldAmount = (CELL_TYPES.brave_chest.extra_gold || 2);
    this.state.goldChips += goldAmount;
    rewards.push({ type: 'gold_chip', name: `+${goldAmount}金色棋子` });
  }

  /**
   * 于此同行暗箱：从格子名解析指定角色，匹配则直接给，否则随机
   */
  _resolveCompanionDarkbox(cellName, rewards) {
    const companionName = parseCompanionName(cellName);

    if (companionName) {
      // 在同行列表中查找指定角色
      const found = this.gacha.companionsList.find(c => c.name === companionName);
      if (found) {
        const rank = found.rank || 'A';
        if (rank === 'S') {
          this._addSCharacterReward(companionName, '于此同行', rewards);
          this.state.resetSPity();
        } else {
          this._addACharacterReward(companionName, '于此同行', rewards);
        }
        return;
      }
    }

    // 没有匹配或未找到，走随机
    const [charName, rank] = this.gacha.gachaCompanion();
    if (rank === 'S') {
      this._addSCharacterReward(charName, '于此同行', rewards);
      this.state.resetSPity();
    } else {
      this._addACharacterReward(charName, '于此同行', rewards);
    }
  }

  /**
   * 迷迭棋盒：从格子名解析白色棋子数量
   */
  _resolveMistBox(cellName, rewards) {
    const amount = parseMistBoxAmount(cellName) || 0;
    if (amount > 0) {
      this.state.whiteChips += amount;
      rewards.push({ type: 'white_chip', name: `+${amount}白色棋子` });
    }
  }

  /**
   * 弧光盲盒（+沉眠池）：给A级弧盘，30%触发沉眠池追逐
   */
  _resolveArcadeBlindSleep(rewards) {
    // 给A级弧盘
    this._addADiskReward(this.gacha.gachaADisk(), '弧光盲盒', rewards);

    // 30%概率触发沉眠池
    if (randomFloat(0, 1) < 0.30) {
      const [sleepRewards, eventInfo] = this._resolveSleepPool();
      rewards.push(...sleepRewards);
    }
  }

  /**
   * 沉眠池追逐
   * @returns {[Array, Object]} [奖励列表, 事件信息]
   */
  _resolveSleepPool() {
    const sp = this.sleepPool;
    sp.startChase();
    const rewards = [];
    let eventInfo = { rounds: [], caught: false, failed: false };

    for (let i = 0; i < SLEEP_POOL_CONFIG.max_chase_rounds; i++) {
      const diceValue = this.rollEngine.rollDice();
      const [caught, failed, roundsLeft, guardianPos, playerPos] = sp.chaseRound(diceValue);
      eventInfo.rounds.push({ diceValue, guardianPos, playerPos, roundsLeft });

      if (caught) {
        eventInfo.caught = true;
        // 追逐成功，给30金棋子
        const goldAmount = SLEEP_POOL_CONFIG.success_reward_gold;
        this.state.goldChips += goldAmount;
        rewards.push({ type: 'gold_chip', name: `+${goldAmount}金色棋子` });
        break;
      }
      if (failed) {
        eventInfo.failed = true;
        break;
      }
    }

    return [rewards, eventInfo];
  }

  /**
   * 皮肤格子暗箱：从皮肤系统抽取
   */
  _resolveSkinCellDarkbox(skinTypeKey, rewards) {
    const [skinFullName, type] = this.gacha.gachaSkin(skinTypeKey);
    const collectionKey = 'skins';
    const [isDup, count] = this.state.addToCollection(collectionKey, skinFullName);
    const dupReward = this.gacha.calculateDuplicateReward(`skin_${skinTypeKey}`, skinFullName, count);
    if (dupReward.gold_chip > 0) {
      this.state.goldChips += dupReward.gold_chip;
    }
    rewards.push({
      type: 'skin',
      name: skinFullName,
      skin_type: skinTypeKey,
      is_duplicate: isDup,
      dup_count: count,
      extra_gold: dupReward.gold_chip,
    });
  }

  /**
   * 添加S级角色奖励到列表
   */
  _addSCharacterReward(charName, reason, rewards) {
    const [isDup, count] = this.state.addToCollection('s_characters', charName);
    const dupReward = this.gacha.calculateDuplicateReward('s_character', charName, count);
    if (dupReward.gold_chip > 0) {
      this.state.goldChips += dupReward.gold_chip;
    }
    rewards.push({
      type: 's_character',
      name: charName,
      is_duplicate: isDup,
      dup_count: count,
      reason,
      fragment: dupReward.fragment,
      extra_gold: dupReward.gold_chip,
    });
  }

  /**
   * 添加A级角色奖励到列表
   */
  _addACharacterReward(charName, reason, rewards) {
    const [isDup, count] = this.state.addToCollection('a_characters', charName);
    const dupReward = this.gacha.calculateDuplicateReward('a_character', charName, count);
    if (dupReward.gold_chip > 0) {
      this.state.goldChips += dupReward.gold_chip;
    }
    rewards.push({
      type: 'a_character',
      name: charName,
      rank: 'A',
      is_duplicate: isDup,
      dup_count: count,
      reason,
      fragment: dupReward.fragment,
      extra_gold: dupReward.gold_chip,
    });
  }

  /**
   * 添加A级弧盘奖励到列表
   */
  _addADiskReward(diskName, reason, rewards) {
    const [isDup, count] = this.state.addToCollection('a_disks', diskName);
    const dupReward = this.gacha.calculateDuplicateReward('a_disk', diskName, count);
    if (dupReward.gold_chip > 0) {
      this.state.goldChips += dupReward.gold_chip;
    }
    rewards.push({
      type: 'a_disk',
      name: diskName,
      is_duplicate: isDup,
      dup_count: count,
      extra_gold: dupReward.gold_chip,
    });
  }

  /**
   * 添加B级弧盘奖励到列表
   */
  _addBDiskReward(rewards) {
    const diskName = this.gacha.gachaBDisk();
    const [isDup, count] = this.state.addToCollection('b_disks', diskName);
    const dupReward = this.gacha.calculateDuplicateReward('b_disk', diskName, count);
    if (dupReward.white_chip > 0) {
      this.state.whiteChips += dupReward.white_chip;
    }
    rewards.push({
      type: 'b_disk',
      name: diskName,
      is_duplicate: isDup,
      dup_count: count,
      extra_white: dupReward.white_chip,
    });
  }

  /**
   * 检查皮肤累计领取：总掷骰次数达到阈值时自动领取
   * @returns {Array} 领取的奖励列表
   */
  _checkSkinClaims() {
    const rewards = [];
    const skinSystem = this.gacha.skinSystem;
    if (!skinSystem) return rewards;

    for (const skinTypeKey of SKIN_TYPE_KEYS) {
      if (this.state.skinClaimed[skinTypeKey]) continue;
      const cfg = skinSystem[skinTypeKey];
      if (!cfg) continue;
      const threshold = cfg.claim_threshold || 3;
      if (this.state.totalRolls >= threshold) {
        this.state.skinClaimed[skinTypeKey] = true;
        const [skinFullName, type] = this.gacha.gachaSkin(skinTypeKey);
        const [isDup, count] = this.state.addToCollection('skins', skinFullName);
        const dupReward = this.gacha.calculateDuplicateReward(`skin_${skinTypeKey}`, skinFullName, count);
        if (dupReward.gold_chip > 0) {
          this.state.goldChips += dupReward.gold_chip;
        }
        rewards.push({
          type: 'skin',
          name: skinFullName,
          skin_type: skinTypeKey,
          is_duplicate: isDup,
          dup_count: count,
          extra_gold: dupReward.gold_chip,
          claim: true,
        });
      }
    }
    return rewards;
  }
}
