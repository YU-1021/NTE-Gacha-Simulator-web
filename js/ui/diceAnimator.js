/**
 * 骰子动画器 - 管理骰子掷骰动画效果
 */
import { randomInt } from '../utils/random.js';

// 骰子点数对应的 Unicode 面（带边框样式）
const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export class DiceAnimator {
  constructor() {
    this.diceElement = null;
    this._animating = false;
  }

  /**
   * 初始化，查找骰子显示元素
   */
  init() {
    this.diceElement = document.getElementById('diceDisplay');
  }

  /**
   * 播放掷骰动画
   * 数字快速跳动后停在最终值，然后调用回调
   * @param {Function} callback - 动画结束后回调，参数为最终骰子值(1~6)
   */
  animate(callback) {
    if (!this.diceElement) this.init();
    if (!this.diceElement) return;
    if (this._animating) return;

    this._animating = true;

    // 添加滚动CSS类
    this.diceElement.classList.add('rolling');

    const finalValue = randomInt(1, 6);
    const duration = 600; // 动画总时长ms
    const interval = 60;  // 每帧间隔ms
    let elapsed = 0;

    const timer = setInterval(() => {
      // 快速显示随机骰面
      const fakeValue = randomInt(1, 6);
      this.diceElement.textContent = DICE_FACES[fakeValue] || fakeValue;
      elapsed += interval;

      if (elapsed >= duration) {
        clearInterval(timer);
        // 停在最终值
        this.diceElement.textContent = DICE_FACES[finalValue] || finalValue;
        this.diceElement.classList.remove('rolling');
        this._animating = false;
        if (callback) callback(finalValue);
      }
    }, interval);
  }

  /**
   * 直接显示骰子值（无动画）
   * @param {number} value - 骰子值(1~6)
   */
  showValue(value) {
    if (!this.diceElement) this.init();
    if (this.diceElement) {
      this.diceElement.textContent = DICE_FACES[value] || value;
    }
  }

  /**
   * 执行一次掷骰动画并返回结果（Promise版）
   * @returns {Promise<number>} 最终骰子值
   */
  rollOnce() {
    return new Promise((resolve) => {
      this.animate((finalValue) => {
        resolve(finalValue);
      });
    });
  }

  /**
   * 重置骰子显示
   */
  reset() {
    if (!this.diceElement) this.init();
    if (this.diceElement) {
      this.diceElement.textContent = '🎲';
    }
  }
}
