/**
 * 群聊刷屏检测插件
 */

import { buildConfigSchema } from './config';
import { pluginState } from './core/state';
import { handleMessage } from './handlers/message-handler';
import { registerApiRoutes } from './services/api-service';

export let plugin_config_ui: any[] = [];

export const plugin_init = async (ctx: any) => {
    try {
        pluginState.init(ctx);
        ctx.logger.info('群聊刷屏检测插件初始化中...');
        plugin_config_ui = buildConfigSchema(ctx);
        registerApiRoutes(ctx);
        ctx.logger.info('群聊刷屏检测插件初始化完成');
    } catch (error) {
        ctx.logger.error('插件初始化失败:', error);
    }
};

export const plugin_onmessage = async (ctx: any, event: any) => {
    if (event.post_type !== 'message') return;
    if (!pluginState.config.enabled) return;
    await handleMessage(ctx, event);
};

export const plugin_cleanup = async (ctx: any) => {
    pluginState.cleanup();
    ctx.logger.info('群聊刷屏检测插件已卸载');
};
