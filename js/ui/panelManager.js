/**
 * 控制面板管理器 - 管理操作按钮和状态显示面板
 */
export class PanelManager {
  constructor() {
    // DOM元素引用（延迟到init时绑定）
    this.rollBtn = null;
    this.tenRollBtn = null;
    this.resetBtn = null;
    this.boardSelect = null;
    this.speedSelect = null;
    this.statusPanel = null;

    // 回调函数
    this._rollCallback = null;
    this._tenRollCallback = null;
    this._resetCallback = null;
    this._boardChangeCallback = null;
    this._speedChangeCallback = null;
  }

  /**
   * 初始化：绑定DOM元素和事件监听
   */
  init() {
    this.rollBtn = document.getElementById('rollBtn');
    this.tenRollBtn = document.getElementById('tenRollBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.boardSelect = document.getElementById('boardSelect');
    this.speedSelect = document.getElementById('speedSelect');
    this.statusPanel = document.getElementById('statusPanel');

    // 单次掷骰按钮
    if (this.rollBtn) {
      this.rollBtn.addEventListener('click', () => {
        if (this._rollCallback) this._rollCallback();
      });
    }

    // 十连掷骰按钮
    if (this.tenRollBtn) {
      this.tenRollBtn.addEventListener('click', () => {
        if (this._tenRollCallback) this._tenRollCallback();
      });
    }

    // 重置按钮
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        if (this._resetCallback) this._resetCallback();
      });
    }

    // 棋盘切换
    if (this.boardSelect) {
      this.boardSelect.addEventListener('change', () => {
        if (this._boardChangeCallback) {
          this._boardChangeCallback(this.boardSelect.value);
        }
      });
    }

    // 速度切换
    if (this.speedSelect) {
      this.speedSelect.addEventListener('change', () => {
        if (this._speedChangeCallback) {
          this._speedChangeCallback(this.getSelectedSpeed());
        }
      });
    }
  }

  /**
   * 设置单次掷骰回调
   */
  setRollCallback(callback) {
    this._rollCallback = callback;
  }

  /**
   * 设置十连掷骰回调
   */
  setTenRollCallback(callback) {
    this._tenRollCallback = callback;
  }

  /**
   * 设置重置回调
   */
  setResetCallback(callback) {
    this._resetCallback = callback;
  }

  /**
   * 设置棋盘切换回调
   */
  setBoardChangeCallback(callback) {
    this._boardChangeCallback = callback;
  }

  /**
   * 设置速度切换回调
   */
  setSpeedChangeCallback(callback) {
    this._speedChangeCallback = callback;
  }

  /**
   * 锁定掷骰按钮（动画播放期间禁用）
   */
  lockRollButton() {
    if (this.rollBtn) this.rollBtn.disabled = true;
    if (this.tenRollBtn) this.tenRollBtn.disabled = true;
  }

  /**
   * 解锁掷骰按钮
   */
  unlockRollButton() {
    if (this.rollBtn) this.rollBtn.disabled = false;
    if (this.tenRollBtn) this.tenRollBtn.disabled = false;
  }

  /**
   * 更新状态面板显示
   * @param {Object} state - 游戏状态对象
   */
  updateStatus(state) {
    // 按 ID 逐项更新，保留原始 DOM 结构
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('statTotalRolls', state.totalRolls);
    set('statPity', `${state.sPityCounter}/90`);
    set('statVariant', state.isVariant ? '变格' : '基准');
    set('statGift', `${state.giftCounter}/10`);
    set('statGoldChips', state.goldChips);
    set('statWhiteChips', state.whiteChips);
  }

  /**
   * 获取当前选中的棋盘ID
   * @returns {string}
   */
  getSelectedBoard() {
    return this.boardSelect ? this.boardSelect.value : '';
  }

  /**
   * 获取当前选中的速度倍率
   * @returns {number}
   */
  getSelectedSpeed() {
    if (!this.speedSelect) return 1;
    const v = parseFloat(this.speedSelect.value);
    return isNaN(v) ? 1 : v; // "0" 要返回 0，不能用 || 1
  }
}
