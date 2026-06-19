// ============================================================
// boardRenderer.js - Canvas 棋盘渲染器
// 基于 HTML5 Canvas API 绘制限定棋盘、分支路径、玩家棋子
// ============================================================

import { getLimitedBoardLayout, getRequiemBoardLayout } from '../data/boardLayout.js';
import { getCellTypeFromName } from '../utils/helpers.js';
import { CELL_TYPES } from '../data/constants.js';

export class BoardRenderer {
    /**
     * @param {HTMLCanvasElement} canvasEl - Canvas 元素引用
     */
    constructor(canvasEl) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        this.layout = null;          // 当前棋盘布局 { main_path, branch1, branch2 }
        this.cellSize = 50;          // 格子尺寸（像素）
        this.boardOffsetX = 0;       // 棋盘绘制偏移 X
        this.boardOffsetY = 0;       // 棋盘绘制偏移 Y
        this.currentPieceIdx = 0;    // 玩家当前在主路径的位置
        this.branchPiecePos = null;  // 分支中的位置 { branchName, seq }
        this._pieceGlowPhase = 0;    // 棋子呼吸灯相位
        this._startPieceGlow();      // 启动棋子呼吸灯
    }

    /**
     * 启动棋子呼吸灯动画（持续运行）
     */
    _startPieceGlow() {
        const animate = () => {
            this._pieceGlowPhase = (Date.now() % 2000) / 2000; // 0~1 周期
            // 如果不在其他动画中，可选重绘（性能考虑默认关闭）
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    /**
     * 加载棋盘布局
     * @param {string} boardId - 棋盘ID，如 "limited_xun" 或 "limited_requiem"
     */
    loadBoard(boardId) {
        switch (boardId) {
            case 'limited_xun':
                this.layout = getLimitedBoardLayout();
                break;
            case 'limited_requiem':
                this.layout = getRequiemBoardLayout();
                break;
            default:
                console.warn(`未知棋盘ID: ${boardId}，使用默认布局`);
                this.layout = getLimitedBoardLayout();
        }
        this.resize();
        this.draw();
    }

    /**
     * 根据容器大小调整 Canvas 尺寸和棋盘偏移
     * 使棋盘居中显示
     */
    resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;

        const containerWidth = parent.clientWidth;

        // 计算棋盘占用的行列范围
        const allCells = this._getAllCells();
        if (allCells.length === 0) return;

        let minRow = Infinity, maxRow = -Infinity;
        let minCol = Infinity, maxCol = -Infinity;
        for (const cell of allCells) {
            if (cell.row < minRow) minRow = cell.row;
            if (cell.row > maxRow) maxRow = cell.row;
            if (cell.col < minCol) minCol = cell.col;
            if (cell.col > maxCol) maxCol = cell.col;
        }

        const colSpan = maxCol - minCol + 1;
        const rowSpan = maxRow - minRow + 1;

        // 根据容器宽度计算格子尺寸，留边距
        const padding = 24;
        this.cellSize = Math.floor((containerWidth - padding * 2) / colSpan);
        // 限制最大尺寸避免过大
        this.cellSize = Math.min(this.cellSize, 56);
        // 保证最小尺寸
        this.cellSize = Math.max(this.cellSize, 28);

        // 计算 Canvas 实际所需尺寸
        const boardWidth = colSpan * this.cellSize;
        const boardHeight = rowSpan * this.cellSize;

        // 设置 Canvas 尺寸（使用 devicePixelRatio 保持清晰）
        const dpr = window.devicePixelRatio || 1;
        const canvasW = boardWidth + padding * 2;
        const canvasH = boardHeight + padding * 2;
        this.canvas.width = canvasW * dpr;
        this.canvas.height = canvasH * dpr;
        this.canvas.style.width = canvasW + 'px';
        this.canvas.style.height = canvasH + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // 计算棋盘偏移，使内容居中
        this.boardOffsetX = padding - minCol * this.cellSize;
        this.boardOffsetY = padding - minRow * this.cellSize;
    }

    /**
     * 主绘制方法：清空画布并绘制完整棋盘
     */
    draw() {
        if (!this.layout) return;

        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.width / dpr;
        const h = this.canvas.height / dpr;

        // 清空画布
        ctx.clearRect(0, 0, w, h);

        // 绘制深色背景渐变
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#12122a');
        bgGrad.addColorStop(1, '#0d0d1e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const { main_path, branch1, branch2 } = this.layout;

        // 绘制主路径连接线
        this._drawPathLines(main_path, 'rgba(255,255,255,0.06)');

        // 绘制主路径格子
        for (let i = 0; i < main_path.length; i++) {
            const cell = main_path[i];
            const px = this.boardOffsetX + cell.col * this.cellSize;
            const py = this.boardOffsetY + cell.row * this.cellSize;
            const highlighted = (this.branchPiecePos === null && this.currentPieceIdx === i);
            const isStart = (cell.name === '起点');
            this.drawCell(px, py, cell.name, i, highlighted, isStart);
        }

        // 绘制分支区域背景
        this._drawBranchBackground(branch1, 'S级角色区', '#A855F7');
        this._drawBranchBackground(branch2, '皮肤惊喜区', '#EC4899');

        // 绘制分支连接线
        this._drawBranchConnectionLine(branch1, main_path[16], '#A855F7');
        this._drawBranchConnectionLine(branch2, main_path[43], '#EC4899');

        // 绘制分支1格子
        this.drawBranchArea(branch1, 'branch1', null, null);
        // 绘制分支2格子
        this.drawBranchArea(branch2, 'branch2', null, null);

        // 绘制玩家棋子（若不在分支中）
        if (!this.branchPiecePos) {
            this.drawPiece(this.currentPieceIdx, false, 0);
        }
    }

    /**
     * 绘制单个格子
     * @param {number} x - 格子左上角 X 像素坐标
     * @param {number} y - 格子左上角 Y 像素坐标
     * @param {string} cellName - 格子中文名
     * @param {number} idx - 格子序号
     * @param {boolean} isHighlighted - 是否高亮（玩家所在位置）
     * @param {boolean} isStart - 是否为起点
     */
    drawCell(x, y, cellName, idx, isHighlighted, isStart = false) {
        const ctx = this.ctx;
        const size = this.cellSize;
        const radius = size * 0.18;
        const padding = 2;

        // 根据格子类型获取颜色
        const cellType = getCellTypeFromName(cellName);
        let color = '#3a3a5c'; // 默认灰色
        if (CELL_TYPES[cellType] && CELL_TYPES[cellType].color) {
            color = CELL_TYPES[cellType].color;
        } else if (isStart) {
            color = '#4a4a6a';
        }

        // 绘制圆角矩形背景
        const rx = x + padding;
        const ry = y + padding;
        const rw = size - padding * 2;
        const rh = size - padding * 2;

        // 阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.arcTo(rx + rw, ry, rx + rw, ry + radius, radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.arcTo(rx + rw, ry + rh, rx + rw - radius, ry + rh, radius);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.arcTo(rx, ry + rh, rx, ry + rh - radius, radius);
        ctx.lineTo(rx, ry + radius);
        ctx.arcTo(rx, ry, rx + radius, ry, radius);
        ctx.closePath();

        // 渐变填充
        const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
        grad.addColorStop(0, this._lightenColor(color, 15));
        grad.addColorStop(1, this._darkenColor(color, 10));
        ctx.fillStyle = grad;
        ctx.fill();

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 高亮边框（玩家当前位置）
        if (isHighlighted) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
            // 发光效果
            ctx.save();
            ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        } else if (isStart) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 绘制格子名称（截短显示）
        const shortName = this._getShortName(cellName);
        ctx.fillStyle = this._getContrastText(color);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.max(size * 0.22, 9);
        ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
        ctx.fillText(shortName, x + size / 2, y + size / 2 - fontSize * 0.4, size - 6);

        // 绘制索引号
        const idxFontSize = Math.max(size * 0.16, 7);
        ctx.font = `${idxFontSize}px "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = this._getContrastText(color);
        ctx.globalAlpha = 0.5;
        ctx.fillText(`#${idx}`, x + size / 2, y + size / 2 + fontSize * 0.5, size - 6);
        ctx.globalAlpha = 1.0;
    }

    /**
     * 绘制玩家棋子（圆形标记 + 发光效果）
     * @param {number} idx - 主路径格子索引
     * @param {boolean} isInBranch - 是否在分支中
     * @param {number} branchStep - 分支中的步骤序号 (1-based)
     */
    drawPiece(idx, isInBranch, branchStep) {
        const ctx = this.ctx;
        let cx, cy;

        if (isInBranch && this.branchPiecePos) {
            const pos = this.getBranchCellCenter(this.branchPiecePos.branchName, branchStep);
            cx = pos.x;
            cy = pos.y;
        } else {
            const pos = this.getCellCenter(idx);
            cx = pos.x;
            cy = pos.y;
        }

        const radius = this.cellSize * 0.22;

        // 呼吸灯相位
        const glowIntensity = 0.3 + 0.2 * Math.sin(this._pieceGlowPhase * Math.PI * 2);

        // 外圈发光
        ctx.save();
        ctx.shadowColor = `rgba(255, 215, 0, ${glowIntensity})`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${glowIntensity * 0.6})`;
        ctx.fill();
        ctx.restore();

        // 棋子主体渐变
        const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
        grad.addColorStop(0, '#FF6B6B');
        grad.addColorStop(0.7, '#E63946');
        grad.addColorStop(1, '#C62828');

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // 棋子边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 高光
        ctx.beginPath();
        ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
    }

    /**
     * 绘制分支区域（3x3 网格）
     * @param {Array} branch - 分支格子数组
     * @param {string} branchName - 分支标识（"branch1" 或 "branch2"）
     * @param {number} originX - 分支入口 X（可选，使用布局数据）
     * @param {number} originY - 分支入口 Y（可选，使用布局数据）
     */
    drawBranchArea(branch, branchName, originX, originY) {
        // 绘制分支中的每个格子
        for (let i = 0; i < branch.length; i++) {
            const cell = branch[i];
            const px = this.boardOffsetX + cell.col * this.cellSize;
            const py = this.boardOffsetY + cell.row * this.cellSize;
            const highlighted = (
                this.branchPiecePos !== null &&
                this.branchPiecePos.branchName === branchName &&
                this.branchPiecePos.seq === cell.seq
            );
            this.drawCell(px, py, cell.name, cell.seq, highlighted);
        }

        // 绘制玩家棋子（若在该分支中）
        if (this.branchPiecePos && this.branchPiecePos.branchName === branchName) {
            this.drawPiece(0, true, this.branchPiecePos.seq);
        }
    }

    /**
     * 获取主路径某个格子的中心像素坐标
     * @param {number} idx - 主路径格子索引
     * @returns {{ x: number, y: number }} 中心坐标
     */
    getCellCenter(idx) {
        if (!this.layout || !this.layout.main_path[idx]) return { x: 0, y: 0 };
        const cell = this.layout.main_path[idx];
        return {
            x: this.boardOffsetX + cell.col * this.cellSize + this.cellSize / 2,
            y: this.boardOffsetY + cell.row * this.cellSize + this.cellSize / 2,
        };
    }

    /**
     * 获取分支某个格子的中心像素坐标
     * @param {string} branchName - 分支标识（"branch1" 或 "branch2"）
     * @param {number} seq - 分支格子序号（1-based）
     * @returns {{ x: number, y: number }} 中心坐标
     */
    getBranchCellCenter(branchName, seq) {
        if (!this.layout) return { x: 0, y: 0 };
        const branch = this.layout[branchName];
        if (!branch) return { x: 0, y: 0 };
        const cell = branch.find(c => c.seq === seq);
        if (!cell) return { x: 0, y: 0 };
        return {
            x: this.boardOffsetX + cell.col * this.cellSize + this.cellSize / 2,
            y: this.boardOffsetY + cell.row * this.cellSize + this.cellSize / 2,
        };
    }

    // ---- 内部辅助方法 ----

    /**
     * 绘制主路径连接线
     * @private
     */
    _drawPathLines(cells, color) {
        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();

        for (let i = 0; i < cells.length - 1; i++) {
            const c1 = cells[i];
            const c2 = cells[i + 1];
            const x1 = this.boardOffsetX + c1.col * this.cellSize + this.cellSize / 2;
            const y1 = this.boardOffsetY + c1.row * this.cellSize + this.cellSize / 2;
            const x2 = this.boardOffsetX + c2.col * this.cellSize + this.cellSize / 2;
            const y2 = this.boardOffsetY + c2.row * this.cellSize + this.cellSize / 2;

            if (i === 0) {
                ctx.moveTo(x1, y1);
            }
            ctx.lineTo(x2, y2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * 绘制分支区域背景
     * @private
     */
    _drawBranchBackground(branch, label, color) {
        if (!branch || branch.length === 0) return;
        const ctx = this.ctx;

        let minRow = Infinity, maxRow = -Infinity;
        let minCol = Infinity, maxCol = -Infinity;
        for (const cell of branch) {
            if (cell.row < minRow) minRow = cell.row;
            if (cell.row > maxRow) maxRow = cell.row;
            if (cell.col < minCol) minCol = cell.col;
            if (cell.col > maxCol) maxCol = cell.col;
        }

        const bx = this.boardOffsetX + minCol * this.cellSize - 4;
        const by = this.boardOffsetY + minRow * this.cellSize - 4;
        const bw = (maxCol - minCol + 1) * this.cellSize + 8;
        const bh = (maxRow - minRow + 1) * this.cellSize + 8;

        // 半透明背景
        ctx.fillStyle = `${color}10`;
        ctx.beginPath();
        const r = 8;
        ctx.moveTo(bx + r, by);
        ctx.lineTo(bx + bw - r, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
        ctx.lineTo(bx + bw, by + bh - r);
        ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
        ctx.lineTo(bx + r, by + bh);
        ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
        ctx.lineTo(bx, by + r);
        ctx.arcTo(bx, by, bx + r, by, r);
        ctx.closePath();
        ctx.fill();

        // 虚线边框
        ctx.strokeStyle = `${color}30`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 标签
        ctx.fillStyle = `${color}80`;
        ctx.font = `10px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, bx + 4, by - 2);
    }

    /**
     * 绘制分支连接线（从主路径入口到分支第一个格子）
     * @private
     */
    _drawBranchConnectionLine(branch, mainCell, color) {
        if (!branch || branch.length === 0 || !mainCell) return;
        const ctx = this.ctx;
        const entryCell = branch[0];

        const fromX = this.boardOffsetX + mainCell.col * this.cellSize + this.cellSize / 2;
        const fromY = this.boardOffsetY + mainCell.row * this.cellSize + this.cellSize / 2;
        const toX = this.boardOffsetX + entryCell.col * this.cellSize + this.cellSize / 2;
        const toY = this.boardOffsetY + entryCell.row * this.cellSize + this.cellSize / 2;

        ctx.beginPath();
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = `${color}60`;
        ctx.lineWidth = 2;
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * 获取所有格子（主路径+分支）
     * @private
     */
    _getAllCells() {
        if (!this.layout) return [];
        const { main_path, branch1, branch2 } = this.layout;
        return [...main_path, ...branch1, ...branch2];
    }

    /**
     * 获取格子的简短显示名
     * @private
     */
    _getShortName(cellName) {
        if (!cellName) return '';
        if (cellName === '起点') return '起点';
        // 移除括号内容
        let short = cellName.replace(/（.*?）/g, '');
        if (short.startsWith('迷迭棋盒')) return '迷迭';
        if (short.startsWith('弧光盲盒')) return '弧光';
        if (short === '沉眠池') return '沉眠';
        if (short === '再来一次') return '再来';
        if (short === '多重惊喜') return '惊喜';
        if (short.includes('+')) {
            const parts = short.split('+');
            return parts.map(p => p.slice(0, 2)).join('+');
        }
        if (short === '学徒宝箱') return '学徒';
        if (short === '勇者宝箱') return '勇者';
        if (short.startsWith('于此同行')) return '同行';
        if (short === '今日穿搭') return '穿搭';
        if (short === '改装时刻·涂装') return '涂装';
        if (short === '风向标') return '风标';
        return short.slice(0, 4);
    }

    /**
     * 根据背景色亮度返回黑色或白色文字
     * @private
     */
    _getContrastText(hexColor) {
        if (!hexColor || hexColor.length < 7) return '#FFFFFF';
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    /**
     * 颜色变亮
     * @private
     */
    _lightenColor(hex, percent) {
        if (!hex || hex.length < 7) return hex;
        const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(255 * percent / 100));
        const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(255 * percent / 100));
        const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(255 * percent / 100));
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * 颜色变暗
     * @private
     */
    _darkenColor(hex, percent) {
        if (!hex || hex.length < 7) return hex;
        const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * percent / 100));
        const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * percent / 100));
        const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * percent / 100));
        return `rgb(${r}, ${g}, ${b})`;
    }
}
