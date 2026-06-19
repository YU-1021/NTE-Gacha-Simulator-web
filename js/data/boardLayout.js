// ============================================================
// boardLayout.js - 棋盘布局数据
// 从 Python 版 board_data.py 移植，纯数据模块
// 主路径55格（起点0 + 54格循环）+ 2个9格分支
// ============================================================

// 限定棋盘（浔）布局数据
export function getLimitedBoardLayout() {
  // 主路径：55个格子（idx 0-54）
  const main_path = [
    { row: 5, col: 10, name: "起点", idx: 0 },
    { row: 5, col: 11, name: "于此同行（海月）", idx: 1 },
    { row: 5, col: 12, name: "学徒宝箱", idx: 2 },
    { row: 5, col: 13, name: "风向标", idx: 3 },
    { row: 5, col: 14, name: "学徒宝箱", idx: 4 },
    { row: 4, col: 14, name: "学徒宝箱", idx: 5 },
    { row: 3, col: 14, name: "勇者宝箱", idx: 6 },
    { row: 2, col: 14, name: "学徒宝箱", idx: 7 },
    { row: 2, col: 15, name: "学徒宝箱", idx: 8 },
    { row: 2, col: 16, name: "迷迭棋盒（30个白色棋子）", idx: 9 },
    { row: 2, col: 17, name: "于此同行（翳）", idx: 10 },
    { row: 3, col: 17, name: "学徒宝箱", idx: 11 },
    { row: 4, col: 17, name: "勇者宝箱", idx: 12 },
    { row: 5, col: 17, name: "学徒宝箱", idx: 13 },
    { row: 5, col: 18, name: "学徒宝箱", idx: 14 },
    { row: 5, col: 19, name: "迷迭棋盒（50个白色棋子）", idx: 15 },
    { row: 6, col: 19, name: "学徒宝箱", idx: 16 },
    { row: 7, col: 19, name: "于此同行（翳）", idx: 17 },
    { row: 8, col: 19, name: "勇者宝箱", idx: 18 },
    { row: 9, col: 19, name: "学徒宝箱", idx: 19 },
    { row: 10, col: 19, name: "学徒宝箱", idx: 20 },
    { row: 11, col: 19, name: "迷迭棋盒（30个白色棋子）", idx: 21 },
    { row: 11, col: 18, name: "弧光盲盒+沉眠池", idx: 22 },
    { row: 11, col: 17, name: "学徒宝箱", idx: 23 },
    { row: 11, col: 16, name: "勇者宝箱", idx: 24 },
    { row: 11, col: 15, name: "学徒宝箱", idx: 25 },
    { row: 11, col: 14, name: "学徒宝箱", idx: 26 },
    { row: 10, col: 14, name: "迷迭棋盒（50个白色棋子）", idx: 27 },
    { row: 10, col: 13, name: "学徒宝箱", idx: 28 },
    { row: 10, col: 12, name: "于此同行（哈尼娅）", idx: 29 },
    { row: 10, col: 11, name: "勇者宝箱", idx: 30 },
    { row: 10, col: 10, name: "学徒宝箱", idx: 31 },
    { row: 10, col: 9, name: "学徒宝箱", idx: 32 },
    { row: 10, col: 8, name: "迷迭棋盒（30个白色棋子）", idx: 33 },
    { row: 9, col: 8, name: "学徒宝箱", idx: 34 },
    { row: 9, col: 7, name: "学徒宝箱", idx: 35 },
    { row: 9, col: 6, name: "勇者宝箱", idx: 36 },
    { row: 9, col: 5, name: "于此同行（哈尼娅）", idx: 37 },
    { row: 9, col: 4, name: "学徒宝箱", idx: 38 },
    { row: 8, col: 4, name: "迷迭棋盒（30个白色棋子）", idx: 39 },
    { row: 7, col: 4, name: "学徒宝箱", idx: 40 },
    { row: 6, col: 4, name: "迷迭棋盒（50个白色棋子）", idx: 41 },
    { row: 5, col: 4, name: "勇者宝箱", idx: 42 },
    { row: 4, col: 4, name: "学徒宝箱", idx: 43 },
    { row: 3, col: 4, name: "于此同行（海月）", idx: 44 },
    { row: 2, col: 4, name: "迷迭棋盒（30个白色棋子）", idx: 45 },
    { row: 2, col: 5, name: "学徒宝箱", idx: 46 },
    { row: 2, col: 6, name: "学徒宝箱", idx: 47 },
    { row: 2, col: 7, name: "勇者宝箱", idx: 48 },
    { row: 2, col: 8, name: "再来一次+沉眠池", idx: 49 },
    { row: 2, col: 9, name: "学徒宝箱", idx: 50 },
    { row: 2, col: 10, name: "弧光盲盒", idx: 51 },
    { row: 2, col: 11, name: "迷迭棋盒（30个白色棋子）", idx: 52 },
    { row: 3, col: 11, name: "学徒宝箱", idx: 53 },
    { row: 4, col: 11, name: "勇者宝箱", idx: 54 },
  ];

  // 分支1（S级角色区）：9个格子
  const branch1 = [
    { row: 6, col: 21, name: "于此同行（浔）", seq: 1 },
    { row: 6, col: 22, name: "改装时刻·涂装", seq: 2 },
    { row: 6, col: 23, name: "勇者宝箱", seq: 3 },
    { row: 6, col: 24, name: "学徒宝箱", seq: 4 },
    { row: 7, col: 24, name: "勇者宝箱", seq: 5 },
    { row: 8, col: 24, name: "学徒宝箱", seq: 6 },
    { row: 8, col: 23, name: "勇者宝箱", seq: 7 },
    { row: 8, col: 22, name: "学徒宝箱", seq: 8 },
    { row: 8, col: 21, name: "勇者宝箱", seq: 9 },
  ];

  // 分支2（皮肤惊喜区）：9个格子
  const branch2 = [
    { row: 4, col: 2, name: "勇者宝箱", seq: 1 },
    { row: 4, col: 1, name: "今日穿搭", seq: 2 },
    { row: 4, col: 0, name: "多重惊喜", seq: 3 },
    { row: 3, col: 0, name: "勇者宝箱", seq: 4 },
    { row: 2, col: 0, name: "勇者宝箱", seq: 5 },
    { row: 1, col: 0, name: "勇者宝箱", seq: 6 },
    { row: 1, col: 1, name: "勇者宝箱", seq: 7 },
    { row: 1, col: 2, name: "勇者宝箱", seq: 8 },
    { row: 2, col: 2, name: "勇者宝箱", seq: 9 },
  ];

  return { main_path, branch1, branch2 };
}

// 限定棋盘（安魂曲）布局数据
// 坐标与浔棋盘相同，仅同行格子名称不同
export function getRequiemBoardLayout() {
  // 主路径：55个格子（idx 0-54）
  const main_path = [
    { row: 5, col: 10, name: "起点", idx: 0 },
    { row: 5, col: 11, name: "于此同行（阿德勒）", idx: 1 },
    { row: 5, col: 12, name: "学徒宝箱", idx: 2 },
    { row: 5, col: 13, name: "风向标", idx: 3 },
    { row: 5, col: 14, name: "学徒宝箱", idx: 4 },
    { row: 4, col: 14, name: "学徒宝箱", idx: 5 },
    { row: 3, col: 14, name: "勇者宝箱", idx: 6 },
    { row: 2, col: 14, name: "学徒宝箱", idx: 7 },
    { row: 2, col: 15, name: "学徒宝箱", idx: 8 },
    { row: 2, col: 16, name: "迷迭棋盒（30个白色棋子）", idx: 9 },
    { row: 2, col: 17, name: "于此同行（埃德嘉）", idx: 10 },
    { row: 3, col: 17, name: "学徒宝箱", idx: 11 },
    { row: 4, col: 17, name: "勇者宝箱", idx: 12 },
    { row: 5, col: 17, name: "学徒宝箱", idx: 13 },
    { row: 5, col: 18, name: "学徒宝箱", idx: 14 },
    { row: 5, col: 19, name: "迷迭棋盒（50个白色棋子）", idx: 15 },
    { row: 6, col: 19, name: "学徒宝箱", idx: 16 },
    { row: 7, col: 19, name: "于此同行（埃德嘉）", idx: 17 },
    { row: 8, col: 19, name: "勇者宝箱", idx: 18 },
    { row: 9, col: 19, name: "学徒宝箱", idx: 19 },
    { row: 10, col: 19, name: "学徒宝箱", idx: 20 },
    { row: 11, col: 19, name: "迷迭棋盒（30个白色棋子）", idx: 21 },
    { row: 11, col: 18, name: "弧光盲盒+沉眠池", idx: 22 },
    { row: 11, col: 17, name: "学徒宝箱", idx: 23 },
    { row: 11, col: 16, name: "勇者宝箱", idx: 24 },
    { row: 11, col: 15, name: "学徒宝箱", idx: 25 },
    { row: 11, col: 14, name: "学徒宝箱", idx: 26 },
    { row: 10, col: 14, name: "迷迭棋盒（50个白色棋子）", idx: 27 },
    { row: 10, col: 13, name: "学徒宝箱", idx: 28 },
    { row: 10, col: 12, name: "于此同行（薄荷）", idx: 29 },
    { row: 10, col: 11, name: "勇者宝箱", idx: 30 },
    { row: 10, col: 10, name: "学徒宝箱", idx: 31 },
    { row: 10, col: 9, name: "学徒宝箱", idx: 32 },
    { row: 10, col: 8, name: "迷迭棋盒（30个白色棋子）", idx: 33 },
    { row: 9, col: 8, name: "学徒宝箱", idx: 34 },
    { row: 9, col: 7, name: "学徒宝箱", idx: 35 },
    { row: 9, col: 6, name: "勇者宝箱", idx: 36 },
    { row: 9, col: 5, name: "于此同行（薄荷）", idx: 37 },
    { row: 9, col: 4, name: "学徒宝箱", idx: 38 },
    { row: 8, col: 4, name: "迷迭棋盒（30个白色棋子）", idx: 39 },
    { row: 7, col: 4, name: "学徒宝箱", idx: 40 },
    { row: 6, col: 4, name: "迷迭棋盒（50个白色棋子）", idx: 41 },
    { row: 5, col: 4, name: "勇者宝箱", idx: 42 },
    { row: 4, col: 4, name: "学徒宝箱", idx: 43 },
    { row: 3, col: 4, name: "于此同行（阿德勒）", idx: 44 },
    { row: 2, col: 4, name: "迷迭棋盒（30个白色棋子）", idx: 45 },
    { row: 2, col: 5, name: "学徒宝箱", idx: 46 },
    { row: 2, col: 6, name: "学徒宝箱", idx: 47 },
    { row: 2, col: 7, name: "勇者宝箱", idx: 48 },
    { row: 2, col: 8, name: "再来一次+沉眠池", idx: 49 },
    { row: 2, col: 9, name: "学徒宝箱", idx: 50 },
    { row: 2, col: 10, name: "弧光盲盒", idx: 51 },
    { row: 2, col: 11, name: "迷迭棋盒（30个白色棋子）", idx: 52 },
    { row: 3, col: 11, name: "学徒宝箱", idx: 53 },
    { row: 4, col: 11, name: "勇者宝箱", idx: 54 },
  ];

  // 分支1（S级角色区）：9个格子，仅首格名称不同
  const branch1 = [
    { row: 6, col: 21, name: "于此同行（安魂曲）", seq: 1 },
    { row: 6, col: 22, name: "改装时刻·涂装", seq: 2 },
    { row: 6, col: 23, name: "勇者宝箱", seq: 3 },
    { row: 6, col: 24, name: "学徒宝箱", seq: 4 },
    { row: 7, col: 24, name: "勇者宝箱", seq: 5 },
    { row: 8, col: 24, name: "学徒宝箱", seq: 6 },
    { row: 8, col: 23, name: "勇者宝箱", seq: 7 },
    { row: 8, col: 22, name: "学徒宝箱", seq: 8 },
    { row: 8, col: 21, name: "勇者宝箱", seq: 9 },
  ];

  // 分支2（皮肤惊喜区）：与浔棋盘完全相同
  const branch2 = [
    { row: 4, col: 2, name: "勇者宝箱", seq: 1 },
    { row: 4, col: 1, name: "今日穿搭", seq: 2 },
    { row: 4, col: 0, name: "多重惊喜", seq: 3 },
    { row: 3, col: 0, name: "勇者宝箱", seq: 4 },
    { row: 2, col: 0, name: "勇者宝箱", seq: 5 },
    { row: 1, col: 0, name: "勇者宝箱", seq: 6 },
    { row: 1, col: 1, name: "勇者宝箱", seq: 7 },
    { row: 1, col: 2, name: "勇者宝箱", seq: 8 },
    { row: 2, col: 2, name: "勇者宝箱", seq: 9 },
  ];

  return { main_path, branch1, branch2 };
}
