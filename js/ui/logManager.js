/**
 * 日志管理器 - 管理滚动日志区域
 */
import { CELL_TYPES } from '../data/constants.js';

// 最大日志条目数
const MAX_ENTRIES = 200;

export class LogManager {
  constructor() {
    this.container = null;
  }

  /**
   * 初始化，查找日志容器元素
   */
  init() {
    this.container = document.getElementById('logContainer');
  }

  /**
   * 添加一条掷骰日志
   * @param {Object} result - 掷骰结果对象
   */
  addEntry(result) {
    if (!this.container) this.init();
    if (!this.container) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';

    // 格子中文名
    const cellDisplayName = result.cellName
      || (CELL_TYPES[result.cellType] ? CELL_TYPES[result.cellType].name : result.cellType);

    // 奖励HTML
    const rewardsHtml = (result.rewards || []).map(r => this._formatReward(r)).join(' ');

    // 集点赠礼HTML
    const giftHtml = result.giftResult
      ? `<span class="log-gift">【赠礼: ${result.giftResult.name}】</span>`
      : '';

    // 分支事件
    const branchHtml = result.branchEvent
      ? `<span class="log-branch">⚑ 进入分支</span>`
      : '';

    entry.innerHTML = `
      <span class="log-roll-num">#${result.rollNumber}</span>
      <span class="log-dice">🎲${result.diceValue}</span>
      <span class="log-cell">[${cellDisplayName}]</span>
      ${rewardsHtml ? `<span class="log-rewards">${rewardsHtml}</span>` : '<span class="log-no-reward">无奖励</span>'}
      ${giftHtml}
      ${branchHtml}
    `;

    // 插入到顶部
    this.container.insertBefore(entry, this.container.firstChild);

    // 超过上限时移除最旧的
    while (this.container.children.length > MAX_ENTRIES) {
      this.container.removeChild(this.container.lastChild);
    }
  }

  /**
   * 清空所有日志
   */
  clear() {
    if (!this.container) this.init();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * 格式化单个奖励为带颜色的HTML
   * @param {Object} reward - 奖励对象
   * @returns {string} HTML字符串
   */
  _formatReward(reward) {
    const name = reward.name || '未知';
    const dupTag = reward.is_duplicate ? `(重复×${reward.dup_count})` : '';

    switch (reward.type) {
      case 's_character':
        return `<span class="reward-s">${name}${dupTag}</span>`;
      case 'a_character':
        return `<span class="reward-a">${name}${dupTag}</span>`;
      case 'b_disk':
        return `<span class="reward-b">${name}${dupTag}</span>`;
      case 'a_disk':
        return `<span class="reward-a-disk">${name}${dupTag}</span>`;
      case 'skin': {
        const claimTag = reward.claim ? '[累计]' : '';
        return `<span class="reward-skin">${name}${dupTag}${claimTag}</span>`;
      }
      case 'white_chip':
        return `<span class="reward-chip-white">${name}</span>`;
      case 'gold_chip':
        return `<span class="reward-chip-gold">${name}</span>`;
      case 'dice':
        return `<span class="reward-dice">${name}</span>`;
      default:
        return `<span>${name}</span>`;
    }
  }
}
