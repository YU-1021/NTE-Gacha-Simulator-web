// ============================================================
// app.js - 主应用入口
// 导入所有模块并串联事件
// ============================================================

import { GameEngine } from './engine/gameEngine.js';
import { BoardRenderer } from './ui/boardRenderer.js';
import { PieceAnimator } from './ui/pieceAnimator.js';
import { PanelManager } from './ui/panelManager.js';
import { ModalManager } from './ui/modalManager.js';
import { LogManager } from './ui/logManager.js';
import { DiceAnimator } from './ui/diceAnimator.js';
import { BOARDS_REGISTRY } from './data/boardData.js';
import { getLimitedBoardLayout, getRequiemBoardLayout } from './data/boardLayout.js';

// 棋盘布局函数映射
const LAYOUT_FUNCS = {
  getLimitedBoardLayout,
  getRequiemBoardLayout,
};

/**
 * 将回调式函数包装为 Promise
 */
function promisify(fn, ...args) {
  return new Promise((resolve) => {
    fn(...args, resolve);
  });
}

class App {
  constructor() {
    // 引擎
    this.engine = null;

    // UI 管理器
    this.boardRenderer = null;
    this.pieceAnimator = null;
    this.panelManager = null;
    this.modalManager = null;
    this.logManager = null;
    this.diceAnimator = null;

    // 位置状态
    this.currentPosIdx = 0;
    this.isInBranch = null;       // null 或 "s_character_zone" / "skin_surprise"
    this.branchStep = 0;          // 分支内步数（0-based，0~8对应9格）

    // 当前棋盘
    this.currentBoardId = 'limited_xun';

    // 按钮锁定
    this._locked = false;
  }

  /**
   * 初始化应用
   */
  init() {
    this.engine = new GameEngine(this.currentBoardId);

    // 获取 DOM 元素
    const canvasEl = document.getElementById('boardCanvas');

    // 创建各 UI 管理器
    this.boardRenderer = new BoardRenderer(canvasEl);
    this.pieceAnimator = new PieceAnimator(this.boardRenderer);
    this.panelManager = new PanelManager();
    this.modalManager = new ModalManager();
    this.logManager = new LogManager();
    this.diceAnimator = new DiceAnimator();

    // 初始化面板（绑定 DOM 事件）
    this.panelManager.init();

    // 绑定回调
    this.panelManager.setRollCallback(() => this.doSingleRoll());
    this.panelManager.setTenRollCallback(() => this.doTenRolls());
    this.panelManager.setResetCallback(() => this.doReset());
    this.panelManager.setBoardChangeCallback((id) => this.changeBoard(id));
    this.panelManager.setSpeedChangeCallback((speed) => this.pieceAnimator.setSpeed(speed));

    // 绑定清空日志按钮
    const clearLogBtn = document.getElementById('clearLogBtn');
    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', () => this.logManager.clear());
    }

    // 加载默认棋盘
    this.boardRenderer.loadBoard(this.currentBoardId);

    // 初始化棋子位置
    this.boardRenderer.currentPieceIdx = 0;
    this.boardRenderer.draw();

    // 窗口尺寸变化时重绘
    window.addEventListener('resize', () => {
      this.boardRenderer.resize();
      this.boardRenderer.draw();
    });

    // 初始更新状态面板
    this._updateStatusPanel();
  }

  /**
   * 获取当前棋盘布局
   */
  _getCurrentLayout() {
    const boardConfig = BOARDS_REGISTRY[this.currentBoardId];
    if (!boardConfig) return null;
    const funcName = boardConfig.layout_func;
    const func = LAYOUT_FUNCS[funcName];
    return func ? func() : null;
  }

  /**
   * 获取当前棋盘的分支入口配置
   */
  _getBranchEntries() {
    const boardConfig = BOARDS_REGISTRY[this.currentBoardId];
    return boardConfig ? boardConfig.branches : null;
  }

  /**
   * 根据位置获取格子信息
   * @param {number} posIdx 主路径位置索引
   * @param {string|null} branchName 分支名称（在分支内时）
   * @param {number} step 分支内步数（0-based）
   * @returns {Object} { name }
   */
  _getCellInfo(posIdx, branchName = null, step = 1) {
    const layout = this._getCurrentLayout();
    if (!layout) return { name: '未知' };

    let cell;
    if (branchName) {
      const branchArr = branchName === 's_character_zone' ? layout.branch1 : layout.branch2;
      // step is 1-based seq, array index = step - 1
      cell = branchArr[step - 1] || null;
    } else {
      cell = layout.main_path[posIdx] || null;
    }

    if (!cell) return { name: '未知' };
    return { name: cell.name };
  }

  // ======================== 核心操作 ========================

  /**
   * 单次掷骰流程（带按钮锁定）
   */
  async doSingleRoll() {
    if (this._locked) return;
    this._locked = true;
    this.panelManager.lockRollButton();

    try {
      await this._executeOneRoll();
    } catch (err) {
      console.error('掷骰出错:', err);
    } finally {
      this._locked = false;
      this.panelManager.unlockRollButton();
    }
  }

  /**
   * 十连掷：依次执行10次掷骰
   */
  async doTenRolls() {
    if (this._locked) return;
    this._locked = true;
    this.panelManager.lockRollButton();

    try {
      const allResults = [];

      for (let i = 0; i < 10; i++) {
        const result = await this._executeOneRoll(true); // skipModal=true
        allResults.push(result);
      }

      // 显示十连批量结果弹窗
      this.modalManager.showBatchResults(allResults);
    } catch (err) {
      console.error('十连掷出错:', err);
    } finally {
      this._locked = false;
      this.panelManager.unlockRollButton();
    }
  }

  /**
   * 执行一次掷骰的核心逻辑（不管理按钮锁）
   * @param {boolean} skipModal - 是否跳过弹窗（十连时使用）
   * @returns {Object} result
   */
  async _executeOneRoll(skipModal = false) {
    const speed = this.panelManager.getSelectedSpeed();

    // 1. 骰子动画（产出骰子点数）
    let diceValue;
    if (speed > 0) {
      diceValue = await this.diceAnimator.rollOnce();
      this.diceAnimator.showValue(diceValue);
    } else {
      diceValue = Math.floor(Math.random() * 6) + 1;
      this.diceAnimator.showValue(diceValue);
    }

    // 2. 计算目标位置
    const fromIdx = this.currentPosIdx;
    let toIdx;
    if (this.isInBranch) {
      // 分支seq 1-based，最大9
      toIdx = Math.min(this.branchStep + diceValue, 9);
    } else {
      toIdx = (this.currentPosIdx + diceValue) % 55;
    }

    // 3. 棋子移动动画
    if (this.isInBranch) {
      await this._animateBranchStep(this.branchStep, toIdx, speed);
      this.branchStep = toIdx; // 1-based seq
    } else {
      await this._animateMainPath(fromIdx, toIdx, speed);
      this.currentPosIdx = toIdx;
    }

    // 4. 获取落点格子信息
    const cellInfo = this._getCellInfo(this.currentPosIdx, this.isInBranch, this.branchStep);

    // 5. 调用引擎执行格子效果结算
    const branchEntries = this._getBranchEntries();
    const result = this.engine.executeSingleRoll({
      currentPosIdx: this.currentPosIdx,
      diceValue,
      cellType: null,
      cellName: cellInfo.name,
      branchEntries,
      isInBranch: this.isInBranch,
      branchStep: this.branchStep,
      fromPosIdx: fromIdx,
    });

    // 6. 处理分支入口事件（自动进入，不再询问）
    if (result.branchEvent && result.branchEvent.type === 'enter_branch') {
      this.isInBranch = result.branchEvent.branch;
      this.branchStep = 1; // 进入后在分支第1格（seq 1-based）
      await this._animateBranchEntry(this.currentPosIdx, 1, speed);
    }

    // 7. 分支内走到第9格后退出分支
    if (this.isInBranch && this.branchStep >= 9) {
      const entries = this._getBranchEntries();
      const entry = entries[this.isInBranch];
      if (entry) {
        const toMainIdx = entry.exit_main_idx;
        await this._animateBranchExit(this.branchStep, toMainIdx, speed);
        this.currentPosIdx = toMainIdx;
      }
      this.isInBranch = null;
      this.branchStep = 0;
      // 同步清除引擎的分支状态
      this.engine.exitBranch();
    }

    // 8. 显示奖励弹窗（跳过动画时不弹）
    if (!skipModal && speed > 0) {
      this.modalManager.showReward(result);
    }

    // 9. 添加到日志
    this.logManager.addEntry(result);

    // 10. 更新状态面板
    this._updateStatusPanel();

    return result;
  }

  // ======================== 动画辅助方法 ========================

  /**
   * 棋子沿主路径移动动画（Promise 包装）
   * 自动处理环绕：始终沿正方向走
   */
  _animateMainPath(fromIdx, toIdx, speed) {
    if (speed <= 0) {
      this.boardRenderer.currentPieceIdx = toIdx;
      this.boardRenderer.branchPiecePos = null;
      this.boardRenderer.draw();
      return Promise.resolve();
    }

    // 始终正向行走，处理环绕
    if (toIdx >= fromIdx) {
      // 正常前进，无需环绕
      return promisify(
        (f, t, s, cb) => this.pieceAnimator.animateMove(f, t, s, cb),
        fromIdx, toIdx, 1
      );
    } else {
      // 环绕：fromIdx → 54（末尾），然后 0 → toIdx
      return promisify(
        (f, t, s, cb) => this.pieceAnimator.animateMove(f, t, s, cb),
        fromIdx, 54, 1
      ).then(() => promisify(
        (f, t, s, cb) => this.pieceAnimator.animateMove(f, t, s, cb),
        0, toIdx, 1
      ));
    }
  }

  /**
   * 棋子进入分支动画（Promise 包装）
   */
  _animateBranchEntry(mainIdx, branchSeq, speed) {
    if (speed <= 0) {
      const branchName = mainIdx <= 20 ? 'branch1' : 'branch2';
      this.boardRenderer.currentPieceIdx = mainIdx;
      this.boardRenderer.branchPiecePos = { branchName, seq: branchSeq };
      this.boardRenderer.draw();
      return Promise.resolve();
    }
    return promisify(
      (m, b, s, cb) => this.pieceAnimator.animateBranchEntry(m, b, s, cb),
      mainIdx, branchSeq, 1
    );
  }

  /**
   * 分支内步进动画（从 fromStep 到 toStep，逐步移动）
   */
  _animateBranchStep(fromStep, toStep, speed) {
    const branchName = this.boardRenderer.branchPiecePos
      ? this.boardRenderer.branchPiecePos.branchName
      : (this.currentPosIdx >= 43 ? 'branch2' : 'branch1');

    if (speed <= 0) {
      this.boardRenderer.branchPiecePos = { branchName, seq: toStep };
      this.boardRenderer.draw();
      return Promise.resolve();
    }

    // 逐格移动
    return new Promise((resolve) => {
      if (fromStep >= toStep) {
        this.boardRenderer.branchPiecePos = { branchName, seq: toStep };
        this.boardRenderer.draw();
        resolve();
        return;
      }
      let current = fromStep;
      const step = () => {
        current++;
        this.boardRenderer.branchPiecePos = { branchName, seq: current };
        this.boardRenderer.draw();
        if (current >= toStep) {
          resolve();
        } else {
          setTimeout(step, 150 / this.pieceAnimator.speedMultiplier);
        }
      };
      step();
    });
  }

  /**
   * 分支退出动画（Promise 包装）
   */
  _animateBranchExit(fromBranchStep, toMainIdx, speed) {
    if (speed <= 0) {
      this.boardRenderer.branchPiecePos = null;
      this.boardRenderer.currentPieceIdx = toMainIdx;
      this.boardRenderer.draw();
      return Promise.resolve();
    }
    return promisify(
      (b, m, s, cb) => this.pieceAnimator.animateBranchExit(b, m, s, cb),
      fromBranchStep, toMainIdx, 1
    );
  }

  /**
   * 显示分支选择弹窗（Promise 包装）
   * @returns {Promise<boolean>} true=进入, false=跳过
   */
  _showBranchChoice() {
    return new Promise((resolve) => {
      this.modalManager.showBranchChoice((entered) => {
        resolve(entered);
      });
    });
  }

  // ======================== 其他操作 ========================

  /**
   * 重置游戏状态
   */
  doReset() {
    this.engine.state.reset();
    this.engine.inBranch = null;
    this.engine.branchStep = 0;
    this.currentPosIdx = 0;
    this.isInBranch = null;
    this.branchStep = 0;

    // 重置棋子到起点
    this.boardRenderer.currentPieceIdx = 0;
    this.boardRenderer.branchPiecePos = null;
    this.boardRenderer.draw();

    this._updateStatusPanel();
    this.logManager.clear();
    this.diceAnimator.reset();
  }

  /**
   * 切换棋盘
   */
  changeBoard(boardId) {
    if (!BOARDS_REGISTRY[boardId]) return;

    this.currentBoardId = boardId;
    this.engine = new GameEngine(boardId);

    // 重置位置
    this.currentPosIdx = 0;
    this.isInBranch = null;
    this.branchStep = 0;

    // 重新加载棋盘渲染
    this.boardRenderer.loadBoard(boardId);
    this.boardRenderer.currentPieceIdx = 0;
    this.boardRenderer.branchPiecePos = null;
    this.boardRenderer.draw();

    this._updateStatusPanel();
    this.logManager.clear();
  }

  // ======================== 状态面板更新 ========================

  /**
   * 更新状态面板显示
   */
  _updateStatusPanel() {
    const state = this.engine.state;
    this.panelManager.updateStatus({
      totalRolls: state.totalRolls,
      sPityCounter: state.sPityCounter,
      isVariant: state.isVariant,
      giftCounter: state.giftCounter,
      goldChips: state.goldChips,
      whiteChips: state.whiteChips,
    });

    // 变格模式视觉反馈
    const boardArea = document.getElementById('boardArea');
    if (boardArea) {
      boardArea.classList.toggle('variant-mode', state.isVariant);
    }
  }
}

// ======================== 启动 ========================

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
