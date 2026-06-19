/**
 * 加密级随机数工具模块
 * 封装 crypto.getRandomValues()，提供类似 Python random 模块的接口
 */

/**
 * 返回 [0, 1) 范围的随机浮点数
 * 等价于 Python 的 random.random()
 * @returns {number}
 */
export function randomFloat() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xFFFFFFFF + 1);
}

/**
 * 返回 [min, max] 范围的随机整数（包含两端）
 * 等价于 Python 的 random.randint(min, max)
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(min, max) {
    const range = max - min + 1;
    // 使用拒绝采样避免模偏差
    const limit = Math.floor((0xFFFFFFFF + 1) / range) * range;
    let r;
    do {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        r = arr[0];
    } while (r >= limit);
    return min + (r % range);
}

/**
 * 从数组中随机选取一个元素
 * 等价于 Python 的 random.choice(seq)
 * @param {Array} array
 * @returns {*}
 */
export function randomChoice(array) {
    return array[randomInt(0, array.length - 1)];
}
