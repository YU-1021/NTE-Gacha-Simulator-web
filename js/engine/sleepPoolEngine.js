/**
 * 沉眠池追逐引擎 - 处理沉眠池的追逐小游戏逻辑
 */
import { SLEEP_POOL_CONFIG } from '../data/constants.js';
import { randomInt } from '../utils/random.js';

export class SleepPoolEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.guardianPos = 0;
    this.playerPos = 0;
    this.roundsLeft = SLEEP_POOL_CONFIG.max_chase_rounds;
  }

  startChase() {
    this.active = true;
    this.guardianPos = SLEEP_POOL_CONFIG.guardian_flee_distance;
    this.playerPos = 0;
    this.roundsLeft = SLEEP_POOL_CONFIG.max_chase_rounds;
  }

  chaseRound(diceValue) {
    if (!this.active) return [false, false, 0, 0, 0];
    this.playerPos += diceValue;
    this.guardianPos += SLEEP_POOL_CONFIG.guardian_speed;
    this.roundsLeft -= 1;
    const caught = this.playerPos >= this.guardianPos;
    const failed = this.roundsLeft <= 0 && !caught;
    if (caught || failed) this.active = false;
    return [caught, failed, this.roundsLeft, this.guardianPos, this.playerPos];
  }
}
