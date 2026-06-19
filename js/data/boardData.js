// ============================================================
// boardData.js - 角色数据库与棋盘注册表
// 从 Python 版 board_data.py 移植，纯数据模块
// ============================================================

import { LIMITED_BOARD_TEMPLATE } from './constants.js';

// --- 角色ID常量 ---
export const CHAR_IDS = {
  S_XUN: "xun",
  S_REQUIEM: "requiem",
  A_HAIYUE: "haiyue",
  A_YI: "yi",
  A_HANIYA: "haniya",
  A_BOHE: "bohe",
  A_AIDEJIA: "aidejia",
  A_ADELE: "adele",
};

// --- 角色数据库 ---
// id → { name, rarity, type }
export const CHARACTER_DB = {
  [CHAR_IDS.S_XUN]:     { name: "浔",   rarity: "S", type: "character" },
  [CHAR_IDS.S_REQUIEM]: { name: "安魂曲", rarity: "S", type: "character" },
  [CHAR_IDS.A_HAIYUE]:  { name: "海月",  rarity: "A", type: "character" },
  [CHAR_IDS.A_YI]:      { name: "翳",   rarity: "A", type: "character" },
  [CHAR_IDS.A_HANIYA]:  { name: "哈尼娅", rarity: "A", type: "character" },
  [CHAR_IDS.A_BOHE]:    { name: "薄荷",  rarity: "A", type: "character" },
  [CHAR_IDS.A_AIDEJIA]: { name: "埃德嘉", rarity: "A", type: "character" },
  [CHAR_IDS.A_ADELE]:   { name: "阿德勒", rarity: "A", type: "character" },
};

// --- 默认皮肤角色 ---
export const SKIN_CHARACTER = "浔";

// --- 棋盘注册表 ---
export const BOARDS_REGISTRY = {
  // 限定棋盘（浔）
  limited_xun: {
    display_name: "★限定棋盘（浔）",
    board_type: "limited",
    s_character_id: CHAR_IDS.S_XUN,
    // 同行格子索引 → 角色ID映射
    companions_id_map: {
      1: CHAR_IDS.A_HAIYUE,
      10: CHAR_IDS.A_YI,
      29: CHAR_IDS.A_HANIYA,
      37: CHAR_IDS.A_HANIYA,
      "B1-0": CHAR_IDS.S_XUN,
    },
    // A级角色主池（常驻同行可出）
    a_pool_main_ids: [CHAR_IDS.A_HANIYA, CHAR_IDS.A_YI, CHAR_IDS.A_HAIYUE],
    // A级角色赠礼专属池
    a_pool_gift_only_ids: [CHAR_IDS.A_BOHE, CHAR_IDS.A_AIDEJIA, CHAR_IDS.A_ADELE],
    // 布局函数名
    layout_func: "getLimitedBoardLayout",
    // 关联文件
    files: {
      rules: "限定棋盘浔规则说明.txt",
    },
    // 规则从通用模板复制
    rules: { ...LIMITED_BOARD_TEMPLATE.rules },
    a_disk_pool: [...LIMITED_BOARD_TEMPLATE.a_disk_pool],
    b_disk_pool: [...LIMITED_BOARD_TEMPLATE.b_disk_pool],
    branches: {
      s_character_zone: { ...LIMITED_BOARD_TEMPLATE.branches.s_character_zone },
      skin_surprise: { ...LIMITED_BOARD_TEMPLATE.branches.skin_surprise },
    },
  },

  // 限定棋盘（安魂曲）
  limited_requiem: {
    display_name: "★限定棋盘（安魂曲）",
    board_type: "limited",
    s_character_id: CHAR_IDS.S_REQUIEM,
    companions_id_map: {
      1: CHAR_IDS.A_ADELE,
      10: CHAR_IDS.A_AIDEJIA,
      29: CHAR_IDS.A_BOHE,
      37: CHAR_IDS.A_BOHE,
      "B1-0": CHAR_IDS.S_REQUIEM,
    },
    a_pool_main_ids: [CHAR_IDS.A_BOHE, CHAR_IDS.A_AIDEJIA, CHAR_IDS.A_ADELE],
    a_pool_gift_only_ids: [CHAR_IDS.A_YI, CHAR_IDS.A_HANIYA, CHAR_IDS.A_HAIYUE],
    layout_func: "getRequiemBoardLayout",
    files: {
      rules: "限定棋盘安魂曲规则说明.txt",
    },
    rules: { ...LIMITED_BOARD_TEMPLATE.rules },
    a_disk_pool: [...LIMITED_BOARD_TEMPLATE.a_disk_pool],
    b_disk_pool: [...LIMITED_BOARD_TEMPLATE.b_disk_pool],
    branches: {
      s_character_zone: { ...LIMITED_BOARD_TEMPLATE.branches.s_character_zone },
      skin_surprise: { ...LIMITED_BOARD_TEMPLATE.branches.skin_surprise },
    },
  },

  // 常驻棋盘（暂未启用）
  permanent_default: {
    enabled: false,
  },
};
