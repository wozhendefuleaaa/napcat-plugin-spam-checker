/**
 * API 服务
 */

import { pluginState } from '../core/state';

export function registerApiRoutes(ctx: any): void {
    // 获取配置
    ctx.registerRouter('GET', '/api/config', async () => {
        return { code: 0, data: pluginState.config };
    });

    // 更新配置
    ctx.registerRouter('POST', '/api/config', async (req: any) => {
        try {
            pluginState.updateConfig(req.body);
            return { code: 0, message: '配置已更新' };
        } catch (e) {
            return { code: -1, message: String(e) };
        }
    });

    // 获取统计
    ctx.registerRouter('GET', '/api/stats', async () => {
        const stats = {
            cacheGroups: pluginState.messageCache.size,
            cacheUsers: Array.from(pluginState.messageCache.values()).reduce((sum, m) => sum + m.size, 0),
        };
        return { code: 0, data: stats };
    });
}
