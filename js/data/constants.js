// ============================================================
// constants.js - 核心常量与配置数据
// 从 Python 版 board_data.py 移植，纯数据模块
// ============================================================

// --- 格子类型定义（11种） ---
export const CELL_TYPES = {
  apprentice_chest: {
    name: "学徒宝箱",
    enter_rate: 0.4593,
    color: "#E8A838",
  },
  brave_chest: {
    name: "勇者宝箱",
    enter_rate: 0.2007,
    color: "#F5C542",
    extra_gold: 2,
  },
  companion: {
    name: "于此同行",
    enter_rate: 0.1086,
    color: "#C850C0",
    sub_rates: { s_character: 0.0119, a_character: 0.0967 },
  },
  mist_box: {
    name: "迷迭棋盒",
    enter_rate: 0.1547,
    color: "#E8E8F0",
  },
  arcade_blind: {
    name: "弧光盲盒",
    enter_rate: 0.0331,
    color: "#5090D0",
  },
  sleep_pool: {
    name: "沉眠池",
    enter_rate: 0.0315,
    color: "#3D2B55",
  },
  roll_again: {
    name: "再来一次",
    enter_rate: 0.0157,
    color: "#45B060",
    dice_reward: 1,
  },
  multi_surprise: {
    name: "多重惊喜",
    enter_rate: 0.0038,
    color: "#FF5090",
    dice_reward: 5,
  },
  today_outfit: {
    name: "今日穿搭",
    enter_rate: 0.0033,
    color: "#FF85C0",
  },
  vehicle_paint: {
    name: "改装时刻·涂装",
    enter_rate: 0.0033,
    color: "#FFB347",
  },
  glider_skin: {
    name: "风向标",
    enter_rate: 0.0171,
    color: "#87CEEB",
  },
};

// --- 格子类型概率累积区间 ---
// 从 CELL_TYPES 计算得出，格式: [cellKey, startBound, endBound]
export const CELL_RATE_BOUNDS = (() => {
  const bounds = [];
  const totalRate = Object.values(CELL_TYPES).reduce((sum, cell) => sum + cell.enter_rate, 0);
  let cumulative = 0;
  for (const [key, val] of Object.entries(CELL_TYPES)) {
    const start = cumulative;
    cumulative += val.enter_rate / totalRate;
    bounds.push([key, start, cumulative]);
  }
  return bounds;
})();

// --- 保底配置 ---
export const PITY_CONFIG = {
  s_pity: {
    variant_threshold: 70,
    hard_pity: 90,
    base_rate_normal: 0.0099,
    base_rate_variant: 0.1959,
  },
  gift_pity: {
    interval: 10,
    a_character_rate: 0.20,
    a_disk_rate: 0.80,
  },
};

// --- 重复获得补偿规则 ---
export const DUPLICATE_RULES = {
  s_character: {
    range_2_7: { fragment: 1, gold_chip: 40 },
    range_8_plus: { gold_chip: 80 },
  },
  a_character: {
    range_2_7: { fragment: 1, gold_chip: 6 },
    range_8_plus: { gold_chip: 12 },
  },
  a_disk: { extra_gold_chip: 4 },
  b_disk: { extra_white_chip: 20 },
  skin_today_outfit: { gold_chip: 16 },
  skin_vehicle_paint: { gold_chip: 16 },
  skin_glider_skin: { gold_chip: 4 },
};

// --- 沉眠池配置 ---
export const SLEEP_POOL_CONFIG = {
  guardian_flee_distance: 9,
  max_chase_rounds: 3,
  guardian_speed: 2,
  success_reward_gold: 30,
};

// --- 迷迭棋盒白色棋子数量池 ---
export const MIST_BOX_WHITE_CHIPS = [15, 20, 25, 30, 35, 40, 45, 50];

// --- 皮肤系统类型键名 ---
export const SKIN_TYPE_KEYS = ["today_outfit", "vehicle_paint", "glider_skin"];

// --- 皮肤系统配置（模板，不含角色专属皮肤列表） ---
// skins 字段为空对象，由 boardData 按角色动态填充
export const SKIN_SYSTEM = {
  today_outfit: {
    name: "今日穿搭",
    enter_rate: 0.0033,
    first_get_rate: 0.0068,
    claim_threshold: 200,
    duplicate_reward_gold: 16,
    color: "#FF85C0",
    icon: "♡",
    short_name: "穿搭",
    skins: {},
  },
  vehicle_paint: {
    name: "改装时刻·涂装",
    enter_rate: 0.0033,
    first_get_rate: 0.0100,
    claim_threshold: 120,
    duplicate_reward_gold: 16,
    color: "#FFB347",
    icon: "✦",
    short_name: "涂装",
    skins: {},
  },
  glider_skin: {
    name: "风向标",
    enter_rate: 0.0171,
    first_get_rate: 0.0296,
    claim_threshold: 50,
    duplicate_reward_gold: 4,
    color: "#87CEEB",
    icon: "✈",
    short_name: "滑翔翼",
    skins: {},
  },
};

// --- A级弧盘池 ---
export const A_DISK_POOL = ["被遗忘者", "开始净空", "当心头顶", "勿忘伞", "拔刀"];

// --- B级弧盘池 ---
export const B_DISK_POOL = ["成功的第一步", "电音狂欢", "危险游戏", "笑口常开", "我们"];

// --- 限定棋盘通用模板 ---
export const LIMITED_BOARD_TEMPLATE = {
  rules: {
    // S级概率
    s_rate: 0.0187,
    s_base_rate_normal: 0.0099,
    s_base_rate_variant: 0.1959,
    s_pity_variant_threshold: 70,
    s_pity_hard: 90,
    // A级概率
    a_rate_total: 0.2298,
    a_character_rate: 0.1167,
    a_disk_rate: 0.1131,
    // B级弧盘概率
    b_disk_rate: 0.6533,
    // 集点赠礼
    gift_interval: 10,
    gift_a_character_rate: 0.20,
    gift_a_disk_rate: 0.80,
    // 各格子类型进入概率
    cell_rates: {
      apprentice_chest: 0.4593,
      brave_chest: 0.2007,
      companion: 0.1086,
      mist_box: 0.1547,
      arcade_blind: 0.0331,
      sleep_pool: 0.0315,
      roll_again: 0.0157,
      multi_surprise: 0.0038,
      today_outfit: 0.0033,
      vehicle_paint: 0.0033,
      glider_skin: 0.0171,
    },
    // 于此同行子概率
    companion_sub_rates: { s_character: 0.0119, a_character: 0.0967 },
    // 宝箱S级概率
    chest_s_rate: {
      apprentice_normal: 0.002,
      brave_normal: 0.03,
      brave_variant: 0.60,
    },
    // 重复补偿规则
    duplicate_rules: {
      s_character: {
        range_2_7: { fragment: 1, gold_chip: 40 },
        range_8_plus: { gold_chip: 80 },
      },
      a_character: {
        range_2_7: { fragment: 1, gold_chip: 6 },
        range_8_plus: { gold_chip: 12 },
      },
      a_disk: { extra_gold_chip: 4 },
      b_disk: { extra_white_chip: 20 },
      skin_today_outfit: { gold_chip: 16 },
      skin_vehicle_paint: { gold_chip: 16 },
      skin_glider_skin: { gold_chip: 4 },
    },
    // 沉眠池配置
    sleep_pool: {
      guardian_flee_distance: 9,
      max_chase_rounds: 3,
      guardian_speed: 2,
      success_reward_gold: 30,
    },
    // 迷迭棋盒白色棋子池
    mist_box_white_chips: [15, 20, 25, 30, 35, 40, 45, 50],
    // 皮肤累计领取阈值
    skin_claim_thresholds: {
      today_outfit: 200,
      vehicle_paint: 120,
      glider_skin: 50,
    },
    // 皮肤首次获取概率
    skin_first_get_rates: {
      today_outfit: 0.0068,
      vehicle_paint: 0.0100,
      glider_skin: 0.0296,
    },
  },
  a_disk_pool: ["被遗忘者", "开始净空", "当心头顶", "勿忘伞", "拔刀"],
  b_disk_pool: ["成功的第一步", "电音狂欢", "危险游戏", "笑口常开", "我们"],
  branches: {
    s_character_zone: { entry_main_idx: 16, skip_main_idx: 17, exit_main_idx: 18, branch_len: 9 },
    skin_surprise: { entry_main_idx: 43, skip_main_idx: 44, exit_main_idx: 45, branch_len: 9 },
  },
};
