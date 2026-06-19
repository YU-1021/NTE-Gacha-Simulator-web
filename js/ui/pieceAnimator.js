// ============================================================
// pieceAnimator.js - 棋子动画控制器
// 使用 requestAnimationFrame 实现棋子在棋盘上的步进动画
// ============================================================

export class PieceAnimator {
    /**
     * @param {import('./boardRenderer.js').BoardRenderer} boardRenderer - BoardRenderer 实例引用
     */
    constructor(boardRenderer) {
        this.renderer = boardRenderer;
        this.animating = false;        // 是否正在播放动画
        this.speedMultiplier = 1;      // 速度倍率（0.5 / 1 / 2 / 4）
        this.animationQueue = [];      // 待播放动画队列
    }

    /**
     * 动画：棋子沿主路径移动
     * @param {number} fromIdx - 起始主路径索引
     * @param {number} toIdx   - 目标主路径索引
     * @param {number} speed   - 速度倍率（传入后与 speedMultiplier 相乘）
     * @param {Function} onComplete - 动画完成回调
     */
    animateMove(fromIdx, toIdx, speed, onComplete) {
        if (this.animating) {
            // 将当前动画排入队列，等待执行
            this.animationQueue.push(() => {
                this.animateMove(fromIdx, toIdx, speed, onComplete);
            });
            return;
        }

        this.animating = true;

        // 沿主路径逐步移动，每步之间有延迟
        this._animateStep(
            fromIdx,
            toIdx,
            (currentIdx) => {
                // 每步更新棋子位置
                this.renderer.currentPieceIdx = currentIdx;
                this.renderer.branchPiecePos = null;
                this.renderer.draw();
            },
            () => {
                // 动画完成
                this.renderer.currentPieceIdx = toIdx;
                this.renderer.draw();
                this.animating = false;
                this._processQueue();
                if (onComplete) onComplete();
            },
            speed
        );
    }

    /**
     * 动画：棋子进入分支
     * @param {number} mainIdx    - 主路径入口索引
     * @param {number} branchIdx  - 分支目标序号（1-based）
     * @param {number} speed      - 速度倍率
     * @param {Function} onComplete - 完成回调
     */
    animateBranchEntry(mainIdx, branchIdx, speed, onComplete) {
        if (this.animating) {
            this.animationQueue.push(() => {
                this.animateBranchEntry(mainIdx, branchIdx, speed, onComplete);
            });
            return;
        }

        this.animating = true;

        // 确定当前所在的分支名称
        // idx 16 对应 branch1，idx 43 对应 branch2
        const branchName = mainIdx === 16 ? 'branch1' : 'branch2';

        // 先将棋子移到主路径入口
        this.renderer.currentPieceIdx = mainIdx;
        this.renderer.draw();

        // 逐步在分支中移动
        this._animateStep(
            1,         // 从分支第1格开始
            branchIdx, // 到目标分支序号
            (currentSeq) => {
                this.renderer.branchPiecePos = { branchName, seq: currentSeq };
                this.renderer.draw();
            },
            () => {
                this.renderer.branchPiecePos = { branchName, seq: branchIdx };
                this.renderer.draw();
                this.animating = false;
                this._processQueue();
                if (onComplete) onComplete();
            },
            speed
        );
    }

    /**
     * 动画：棋子从分支退回主路径
     * @param {number} branchIdx - 当前分支序号（1-based）
     * @param {number} mainIdx   - 主路径目标索引
     * @param {number} speed     - 速度倍率
     * @param {Function} onComplete - 完成回调
     */
    animateBranchExit(branchIdx, mainIdx, speed, onComplete) {
        if (this.animating) {
            this.animationQueue.push(() => {
                this.animateBranchExit(branchIdx, mainIdx, speed, onComplete);
            });
            return;
        }

        this.animating = true;

        const branchName = this.renderer.branchPiecePos
            ? this.renderer.branchPiecePos.branchName
            : (mainIdx >= 43 ? 'branch2' : 'branch1');

        // 从当前分支序号退回到第1格（如果需要），然后回到主路径
        // 简化处理：直接跳出到主路径目标位置
        const startPos = 0; // 用0表示"跳出"的中间状态
        const endPos = 1;

        this._animateStep(
            startPos,
            endPos,
            (_step) => {
                // 过渡动画：半透明效果
            },
            () => {
                // 切换到主路径
                this.renderer.branchPiecePos = null;
                this.renderer.currentPieceIdx = mainIdx;
                this.renderer.draw();
                this.animating = false;
                this._processQueue();
                if (onComplete) onComplete();
            },
            speed
        );
    }

    /**
     * 设置动画速度倍率
     * @param {number} multiplier - 速度倍率：0.5 / 1 / 2 / 4
     */
    setSpeed(multiplier) {
        const valid = [0.5, 1, 2, 4];
        if (valid.includes(multiplier)) {
            this.speedMultiplier = multiplier;
        } else {
            // 找到最近的合法值
            const closest = valid.reduce((prev, curr) =>
                Math.abs(curr - multiplier) < Math.abs(prev - multiplier) ? curr : prev
            );
            this.speedMultiplier = closest;
        }
    }

    /**
     * 跳过当前动画，直接到达最终位置
     */
    skipAnimation() {
        // 清空动画队列
        this.animationQueue = [];

        // 停止当前动画（_animateStep 会通过 animating 状态判断）
        // 此处标记为非动画状态，下次 draw 时渲染最终位置即可
        this.animating = false;
        this.renderer.draw();
    }

    /**
     * 内部：逐格步进动画
     * 使用 requestAnimationFrame 驱动定时步进
     * @param {number} from - 起始值（格子索引或分支序号）
     * @param {number} to   - 目标值
     * @param {Function} stepCallback - 每步回调，参数为当前值
     * @param {Function} completeCallback - 完成回调
     * @param {number} speed - 额外速度系数
     * @private
     */
    _animateStep(from, to, stepCallback, completeCallback, speed = 1) {
        const direction = from <= to ? 1 : -1;
        const totalSteps = Math.abs(to - from);

        if (totalSteps === 0) {
            if (completeCallback) completeCallback();
            return;
        }

        // 每步间隔（毫秒）= 基准时间 / (速度倍率 * 额外速度)
        const baseMs = 200;
        const intervalMs = baseMs / (this.speedMultiplier * speed);

        let currentStep = 0;
        let currentValue = from;
        let lastTimestamp = 0;

        const animate = (timestamp) => {
            // 检查是否被跳过
            if (!this.animating) {
                // 直接跳到终点
                if (stepCallback) stepCallback(to);
                return;
            }

            if (!lastTimestamp) lastTimestamp = timestamp;
            const elapsed = timestamp - lastTimestamp;

            if (elapsed >= intervalMs) {
                lastTimestamp = timestamp;
                currentStep++;
                currentValue = from + direction * currentStep;

                if (stepCallback) stepCallback(currentValue);

                if (currentStep >= totalSteps) {
                    // 动画完成
                    if (completeCallback) completeCallback();
                    return;
                }
            }

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    /**
     * 处理动画队列，执行下一个待播放动画
     * @private
     */
    _processQueue() {
        if (this.animationQueue.length > 0) {
            const next = this.animationQueue.shift();
            if (next) next();
        }
    }
}
