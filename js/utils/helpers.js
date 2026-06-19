/**
 * 通用辅助函数模块
 * 包含格子类型解析、棋盘配置查询、数据合并等工具函数
 */

import { CHARACTER_DB, BOARDS_REGISTRY, CHAR_IDS, SKIN_CHARACTER } from '../data/boardData.js';
import { LIMITED_BOARD_TEMPLATE, SKIN_SYSTEM, PITY_CONFIG } from '../data/constants.js';

/**
 * 中文格子名 → cell_type 映射表
 * 包含基础类型和组合类型
 */
const CELL_NAME_MAP = {
    '学徒宝箱': 'apprentice_chest',
    '勇者宝箱': 'brave_chest',
    '迷迭棋盒': 'mist_box',
    '弧光盲盒': 'arcade_blind',
    '沉眠池': 'sleep_pool',
    '再来一次': 'roll_again',
    '多重惊喜': 'multi_surprise',
    '今日穿搭': 'today_outfit',
    '改装时刻·涂装': 'vehicle_paint',
    '风向标': 'glider_skin',
};

/**
 * 组合格子映射（包含"+"的复合格子）
 */
const COMBO_CELL_MAP = {
    '弧光盲盒+沉眠池': 'arcade_blind_sleep',
    '再来一次+沉眠池': 'roll_again_sleep',
};

/**
 * 从格子中文名解析出 cell_type key
 * 支持：
 *   - 基础类型："学徒宝箱" → "apprentice_chest"
 *   - 带括号参数："于此同行（海月）" → "companion"
 *   - 带括号参数："迷迭棋盒（30个白色棋子）" → "mist_box"
 *   - 组合类型："弧光盲盒+沉眠池" → "arcade_blind_sleep"
 * @param {string} cellName 格子中文名
 * @returns {string} cell_type key
 */
export function getCellTypeFromName(cellName) {
    if (!cellName) return 'unknown';

    // 先检查组合类型（含"+"的格子）
    if (cellName.includes('+')) {
        for (const [key, value] of Object.entries(COMBO_CELL_MAP)) {
            if (cellName.includes(key)) {
                return value;
            }
        }
    }

    // 检查"于此同行"（带括号角色名）
    if (cellName.startsWith('于此同行')) {
        return 'companion';
    }

    // 检查"迷迭棋盒"（带括号数量）
    if (cellName.startsWith('迷迭棋盒')) {
        return 'mist_box';
    }

    // 精确匹配基础类型
    if (CELL_NAME_MAP[cellName]) {
        return CELL_NAME_MAP[cellName];
    }

    // 前缀匹配（处理可能的变体）
    for (const [key, value] of Object.entries(CELL_NAME_MAP)) {
        if (cellName.startsWith(key)) {
            return value;
        }
    }

    return 'unknown';
}

/**
 * getCellTypeFromLayout - 从棋盘布局中的中文格子名映射到 cell_type key
 * 与 getCellTypeFromName 相同功能，用于布局数据解析时的别名
 * @param {string} cellName 格子中文名
 * @returns {string} cell_type key
 */
export function getCellTypeFromLayout(cellName) {
    return getCellTypeFromName(cellName);
}

/**
 * 从"迷迭棋盒（N个白色棋子）"中提取数字 N
 * @param {string} cellName 格子中文名，如 "迷迭棋盒（30个白色棋子）"
 * @returns {number|null} 提取到的数量，解析失败返回 null
 */
export function parseMistBoxAmount(cellName) {
    const match = cellName.match(/迷迭棋盒（(\d+)个白色棋子）/);
    if (match) {
        return parseInt(match[1], 10);
    }
    // 兜底：尝试匹配"迷迭棋盒（N..."格式
    const fallback = cellName.match(/迷迭棋盒（(\d+)/);
    if (fallback) {
        return parseInt(fallback[1], 10);
    }
    return null;
}

/**
 * 从"于此同行（角色名）"中提取角色名
 * @param {string} cellName 格子中文名，如 "于此同行（海月）"
 * @returns {string|null} 角色名，解析失败返回 null
 */
export function parseCompanionName(cellName) {
    const match = cellName.match(/于此同行（(.+?)）/);
    return match ? match[1] : null;
}

/**
 * 根据角色 ID 从角色数据库中查找角色名称
 * @param {string} charId 角色 ID
 * @returns {string} 角色名称，未找到则返回 charId 本身
 */
export function getCharName(charId) {
    const char = CHARACTER_DB[charId];
    return char ? char.name : charId;
}

/**
 * 获取棋盘配置
 * @param {string} boardId 棋盘 ID
 * @returns {Object|null} 棋盘配置对象
 */
export function getBoardConfig(boardId) {
    return BOARDS_REGISTRY[boardId] || null;
}

/**
 * 获取 S 级角色池
 * 根据棋盘配置中的 s_character_id，返回 S 角色对象列表
 * @param {string} boardId 棋盘 ID
 * @returns {Array} [{name, rate: 0.0187, limited: true}]
 */
export function getSPool(boardId) {
    const config = getBoardConfig(boardId);
    if (!config || !config.s_character_id) return [];
    const charName = getCharName(config.s_character_id);
    return [{ name: charName, rate: 0.0187, limited: true }];
}

/**
 * 获取 A 级角色池
 * 主池角色和赠礼专属池角色，带不同概率
 * @param {string} boardId 棋盘 ID
 * @returns {Array} [{name, rate, gift_only}]
 */
export function getAPool(boardId) {
    const config = getBoardConfig(boardId);
    if (!config) return [];

    const mainRates = [0.0376, 0.0346, 0.0345];
    const result = [];

    const mainIds = config.a_pool_main_ids || [];
    mainIds.forEach((id, i) => {
        const charName = getCharName(id);
        result.push({ name: charName, rate: mainRates[i] || 0, gift_only: false });
    });

    const giftIds = config.a_pool_gift_only_ids || [];
    giftIds.forEach(id => {
        const charName = getCharName(id);
        result.push({ name: charName, rate: 0.0033, gift_only: true });
    });

    return result;
}

/**
 * 获取棋盘的 S 角色名称（皮肤角色）
 * @param {string} boardId 棋盘 ID
 * @returns {string|null} S 角色名称字符串
 */
export function getSkinCharacter(boardId) {
    const config = getBoardConfig(boardId);
    if (!config || !config.s_character_id) return null;
    return getCharName(config.s_character_id);
}

/**
 * 获取棋盘的皮肤系统配置
 * 复制 SKIN_SYSTEM 模板，为每个皮肤类型填入该棋盘 S 角色的皮肤键
 * @param {string} boardId 棋盘 ID
 * @returns {Object} 该棋盘的皮肤系统配置（deep copy）
 */
export function getSkinSystem(boardId) {
    const config = getBoardConfig(boardId);
    if (!config || !config.s_character_id) return null;

    const charName = getCharName(config.s_character_id);
    const result = {};

    for (const [typeKey, typeConfig] of Object.entries(SKIN_SYSTEM)) {
        result[typeKey] = {
            ...typeConfig,
            skins: { [charName]: `${charName}-${typeConfig.short_name}` },
        };
    }

    return result;
}

/**
 * 获取棋盘的同行角色列表
 * S 角色排在前面，随后是去重的 A 角色
 * @param {string} boardId 棋盘 ID
 * @returns {Array} [{name, rank}]
 */
export function getCompanionsList(boardId) {
    const config = getBoardConfig(boardId);
    if (!config || !config.companions_id_map) return [];

    const companionsMap = config.companions_id_map;
    const seenIds = new Set();
    const sEntries = [];
    const aEntries = [];

    for (const id of Object.values(companionsMap)) {
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const char = CHARACTER_DB[id];
        if (!char) continue;

        const entry = { name: char.name, rank: char.rarity };
        if (char.rarity === 'S') {
            sEntries.push(entry);
        } else {
            aEntries.push(entry);
        }
    }

    return [...sEntries, ...aEntries];
}

/**
 * 获取棋盘规则（带深度合并）
 * 将通用规则模板（LIMITED_BOARD_TEMPLATE.rules）与棋盘自定义规则深度合并
 * @param {string} boardId 棋盘 ID
 * @returns {Object} 合并后的完整规则对象
 */
export function getBoardRules(boardId) {
    const config = getBoardConfig(boardId);
    if (!config) return {};
    const customRules = config.rules || {};
    return deepMerge(LIMITED_BOARD_TEMPLATE.rules, customRules);
}

/**
 * 深度合并两个对象
 * customDict 中的值会覆盖 defaultDict 中对应的值
 * 对嵌套对象递归合并，而非整体替换
 * @param {Object} defaultDict 默认值对象
 * @param {Object} customDict 自定义覆盖值对象
 * @returns {Object} 合并后的新对象
 */
export function deepMerge(defaultDict, customDict) {
    const result = { ...defaultDict };
    for (const key of Object.keys(customDict)) {
        if (
            customDict[key] &&
            typeof customDict[key] === 'object' &&
            !Array.isArray(customDict[key]) &&
            defaultDict[key] &&
            typeof defaultDict[key] === 'object' &&
            !Array.isArray(defaultDict[key])
        ) {
            // 两者都是纯对象，递归合并
            result[key] = deepMerge(defaultDict[key], customDict[key]);
        } else {
            // 基本类型或数组，直接覆盖
            result[key] = customDict[key];
        }
    }
    return result;
}
