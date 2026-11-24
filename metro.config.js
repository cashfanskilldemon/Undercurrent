const { getDefaultConfig } = require('expo/metro-config');

/**
 * Windows 下 Metro 会同时持有大量文件句柄，改代码触发重建时容易 EMFILE
 * （too many open files），dev server 直接挂掉。
 * 这里压低并发 worker 数量，减少同一时刻打开的文件数。
 */
const config = getDefaultConfig(__dirname);

config.maxWorkers = 4;

module.exports = config;
