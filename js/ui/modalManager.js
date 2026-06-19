/**
 * 弹窗管理器 - 管理抽卡结果弹窗和选择对话框
 */
export class ModalManager {
  constructor() {
    this.overlay = null;
    this.modalContent = null;
    this._autoDismissTimer = null;
  }

  /**
   * 确保弹窗容器已创建（优先使用 index.html 中已有的 DOM 元素）
   */
  _ensureOverlay() {
    if (this.overlay) return;

    // 优先使用页面中已有的 #modalOverlay 和 #modalContent
    this.overlay = document.getElementById('modalOverlay');
    this.modalContent = document.getElementById('modalContent');

    if (!this.overlay) {
      // 兜底：动态创建
      this.overlay = document.createElement('div');
      this.overlay.id = 'modalOverlay';
      this.overlay.className = 'modal-overlay';
      document.body.appendChild(this.overlay);
    }
    if (!this.modalContent) {
      this.modalContent = document.createElement('div');
      this.modalContent.id = 'modalContent';
      this.modalContent.className = 'modal-content';
      this.overlay.appendChild(this.modalContent);
    }

    // 点击遮罩层关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });
  }

  /**
   * 显示抽卡结果弹窗
   * @param {Object} result - 掷骰结果对象（包含 rewards 数组）
   */
  showReward(result) {
    this._ensureOverlay();
    this._clearAutoDismiss();

    if (!result.rewards || result.rewards.length === 0) {
      // 无奖励时显示骰子结果
      const { html, cssClass } = this._createModalContent('none', result);
      this.modalContent.innerHTML = html;
      this.modalContent.className = `modal-content ${cssClass}`;
      this._show();
      this._setAutoDismiss(2000);
      return;
    }

    // 取第一个主奖励用于弹窗样式
    const primary = result.rewards[0];
    const { html, cssClass, autoDismiss } = this._createModalContent(primary.type, {
      reward: primary,
      allRewards: result.rewards,
      diceValue: result.diceValue,
      rollNumber: result.rollNumber,
    });

    this.modalContent.innerHTML = html;
    this.modalContent.className = `modal-content ${cssClass}`;
    this._show();

    // 芯片/骰子奖励自动关闭，角色/皮肤手动关闭
    if (autoDismiss) {
      this._setAutoDismiss(1800);
    } else {
      // 点击内容区关闭
      const handler = () => {
        this.hide();
        this.modalContent.removeEventListener('click', handler);
      };
      this.modalContent.addEventListener('click', handler);
    }
  }

  /**
   * 显示分支选择对话框
   * @param {Function} callback - callback(true)进入分支，callback(false)跳过
   */
  showBranchChoice(callback) {
    this._ensureOverlay();
    this._clearAutoDismiss();

    this.modalContent.innerHTML = `
      <div class="modal-branch-title">发现分支入口</div>
      <div class="modal-branch-desc">是否进入分支路径探索？</div>
      <div class="modal-branch-buttons">
        <button id="branchEnterBtn" class="modal-branch-btn modal-branch-enter">进入分支</button>
        <button id="branchSkipBtn" class="modal-branch-btn modal-branch-skip">跳过</button>
      </div>
    `;

    this.modalContent.className = 'modal-content modal-none';
    this._show();

    document.getElementById('branchEnterBtn').addEventListener('click', () => {
      this.hide();
      callback(true);
    });

    document.getElementById('branchSkipBtn').addEventListener('click', () => {
      this.hide();
      callback(false);
    });
  }

  /**
   * 显示沉眠池追逐结果
   * @param {Object} eventInfo - 追逐事件信息
   */
  showSleepPoolEvent(eventInfo) {
    this._ensureOverlay();
    this._clearAutoDismiss();

    const resultText = eventInfo.caught ? '追逐成功！' : '追逐失败…';
    const color = eventInfo.caught ? '#4ADE80' : '#EF4444';

    let roundsHtml = '';
    if (eventInfo.rounds) {
      roundsHtml = eventInfo.rounds.map((r, i) =>
        `<div class="modal-detail">第${i + 1}轮: 骰子${r.diceValue} | 守护者${r.guardianPos} 你${r.playerPos}</div>`
      ).join('');
    }

    this.modalContent.innerHTML = `
      <div class="modal-detail" style="margin-bottom: 8px;">沉眠池追逐</div>
      <div style="font-size: 28px; font-weight: 800; color: ${color}; margin-bottom: 16px;">${resultText}</div>
      ${roundsHtml}
      <div class="modal-close" onclick="this.parentElement.parentElement.style.display='none'">确定</div>
    `;

    this.modalContent.className = 'modal-content modal-none';
    this._show();
    this._setAutoDismiss(2500);
  }

  /**
   * 批量显示十连结果（列表形式）
   * @param {Array} allResults - 10个掷骰结果对象
   */
  showBatchResults(allResults) {
    this._ensureOverlay();
    this._clearAutoDismiss();

    const items = allResults.map((r, i) => {
      const rewards = r.rewards || [];
      if (rewards.length === 0) {
        return `<div class="batch-item"><span class="batch-num">#${i + 1}</span><span class="batch-dice">骰${r.diceValue}</span><span class="batch-reward log-no-reward">无奖励</span></div>`;
      }
      const rewardHtml = rewards.map(rw => {
        let css = 'log-b';
        if (rw.type === 's_character') css = 'log-s';
        else if (rw.type === 'a_character' || rw.type === 'a_disk') css = 'log-a';
        else if (rw.type === 'skin') css = 'log-skin';
        else if (rw.type === 'gold_chip') css = 'reward-chip-gold';
        else if (rw.type === 'white_chip') css = 'reward-chip-white';
        else if (rw.type === 'dice') css = 'log-dice';
        return `<span class="${css}">${rw.name}</span>`;
      }).join(' ');
      return `<div class="batch-item"><span class="batch-num">#${i + 1}</span><span class="batch-dice">骰${r.diceValue}</span><span class="batch-reward">${rewardHtml}</span></div>`;
    }).join('');

    this.modalContent.innerHTML = `
      <div style="font-size:18px;font-weight:700;margin-bottom:16px;color:var(--text-white);">十连结果</div>
      <div class="batch-list">${items}</div>
      <div class="modal-close">点击关闭</div>
    `;

    this.modalContent.className = 'modal-content modal-none';
    this._show();

    const handler = () => {
      this.hide();
      this.modalContent.removeEventListener('click', handler);
    };
    this.modalContent.addEventListener('click', handler);
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this._clearAutoDismiss();
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  /**
   * 创建弹窗内容
   * @param {string} type - 奖励类型
   * @param {Object} data - 奖励数据
   * @returns {Object} 包含 html, cssClass, autoDismiss
   */
  _createModalContent(type, data) {
    switch (type) {
      // S级角色：金色特效弹窗
      case 's_character': {
        const r = data.reward;
        const dupTag = r.is_duplicate ? `<span class="modal-detail">(重复 x${r.dup_count})</span>` : '';
        const extraHtml = r.extra_gold ? `<div class="modal-detail" style="margin-top:6px;">+${r.extra_gold} 金色棋子</div>` : '';
        return {
          html: `
            <div class="modal-rank-badge">S 级角色</div>
            <div class="modal-reward-name">${r.name}</div>
            ${dupTag}
            <div class="modal-detail">来源: ${r.reason || '未知'}</div>
            ${extraHtml}
            <div class="modal-close">点击关闭</div>
          `,
          cssClass: 'modal-s',
          autoDismiss: false,
        };
      }

      // A级角色：紫色特效弹窗
      case 'a_character': {
        const r = data.reward;
        const dupTag = r.is_duplicate ? `<span class="modal-detail">(重复 x${r.dup_count})</span>` : '';
        const extraHtml = r.extra_gold ? `<div class="modal-detail" style="margin-top:6px;">+${r.extra_gold} 金色棋子</div>` : '';
        return {
          html: `
            <div class="modal-rank-badge">A 级角色</div>
            <div class="modal-reward-name">${r.name}</div>
            ${dupTag}
            <div class="modal-detail">来源: ${r.reason || '未知'}</div>
            ${extraHtml}
            <div class="modal-close">点击关闭</div>
          `,
          cssClass: 'modal-a',
          autoDismiss: false,
        };
      }

      // B级弧盘：蓝色背景
      case 'b_disk': {
        const r = data.reward;
        const dupTag = r.is_duplicate ? `<span class="modal-detail">(重复 x${r.dup_count})</span>` : '';
        const extraHtml = r.extra_white ? `<div class="modal-detail" style="margin-top:6px;">+${r.extra_white} 白色棋子</div>` : '';
        return {
          html: `
            <div class="modal-rank-badge" style="background:rgba(255,255,255,0.12);color:#93C5FD;">B 级弧盘</div>
            <div class="modal-reward-name" style="font-size:22px;">${r.name}</div>
            ${dupTag}
            ${extraHtml}
            <div class="modal-close">点击关闭</div>
          `,
          cssClass: 'modal-b',
          autoDismiss: false,
        };
      }

      // A级弧盘：蓝紫色背景
      case 'a_disk': {
        const r = data.reward;
        const dupTag = r.is_duplicate ? `<span class="modal-detail">(重复 x${r.dup_count})</span>` : '';
        const extraHtml = r.extra_gold ? `<div class="modal-detail" style="margin-top:6px;">+${r.extra_gold} 金色棋子</div>` : '';
        return {
          html: `
            <div class="modal-rank-badge" style="background:rgba(255,255,255,0.12);color:#C4B5FD;">A 级弧盘</div>
            <div class="modal-reward-name" style="font-size:24px;">${r.name}</div>
            ${dupTag}
            ${extraHtml}
            <div class="modal-close">点击关闭</div>
          `,
          cssClass: 'modal-a',
          autoDismiss: false,
        };
      }

      // 皮肤：粉橙色背景
      case 'skin': {
        const r = data.reward;
        const dupTag = r.is_duplicate ? `<span class="modal-detail">(重复 x${r.dup_count})</span>` : '';
        const claimTag = r.claim ? ' [累计领取]' : '';
        const extraHtml = r.extra_gold ? `<div class="modal-detail" style="margin-top:6px;">+${r.extra_gold} 金色棋子</div>` : '';
        return {
          html: `
            <div class="modal-rank-badge" style="background:rgba(255,255,255,0.12);color:#FDE68A;">皮肤${claimTag}</div>
            <div class="modal-reward-name" style="font-size:22px;">${r.name}</div>
            ${dupTag}
            ${extraHtml}
            <div class="modal-close">点击关闭</div>
          `,
          cssClass: 'modal-skin',
          autoDismiss: false,
        };
      }

      // 白色棋子：简单通知
      case 'white_chip': {
        const r = data.reward;
        return {
          html: `<div style="font-size:20px;font-weight:600;">${r.name}</div>`,
          cssClass: 'modal-none',
          autoDismiss: true,
        };
      }

      // 金色棋子：简单通知
      case 'gold_chip': {
        const r = data.reward;
        return {
          html: `<div style="font-size:20px;font-weight:600;color:#FCD34D;">${r.name}</div>`,
          cssClass: 'modal-none',
          autoDismiss: true,
        };
      }

      // 骰子奖励：绿色通知
      case 'dice': {
        const r = data.reward;
        return {
          html: `<div style="font-size:20px;font-weight:600;color:#4ADE80;">${r.name}</div>`,
          cssClass: 'modal-none',
          autoDismiss: true,
        };
      }

      // 无奖励（仅显示骰子结果）
      default: {
        return {
          html: `
            <div class="modal-detail">掷骰结果</div>
            <div style="font-size:32px;font-weight:800;margin:12px 0;">骰子: ${data.diceValue || '?'}</div>
            <div class="modal-detail">未获得奖励</div>
          `,
          cssClass: 'modal-none',
          autoDismiss: true,
        };
      }
    }
  }

  /**
   * 显示弹窗
   */
  _show() {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
    }
  }

  /**
   * 设置自动关闭定时器
   */
  _setAutoDismiss(delay) {
    this._autoDismissTimer = setTimeout(() => this.hide(), delay);
  }

  /**
   * 清除自动关闭定时器
   */
  _clearAutoDismiss() {
    if (this._autoDismissTimer) {
      clearTimeout(this._autoDismissTimer);
      this._autoDismissTimer = null;
    }
  }
}
