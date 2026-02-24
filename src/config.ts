/**
 * 插件配置模块
 */

import type { PluginConfig } from './types';

export const DEFAULT_CONFIG: PluginConfig = {
    enabled: true,
    debug: false,
    spam: {
        repeatWindow: 5,
        repeatCount: 3,
        frequencyWindow: 10,
        frequencyCount: 10,
        similarityThreshold: 0.8,
        similarityWindow: 10,
        similarityCount: 3,
        keywordWindow: 30,
        keywordCount: 5,
        mediaWindow: 30,
        mediaCount: 5,
        atSingleLimit: 5,
        atWindow: 30,
        atWindowLimit: 10,
        linkWindow: 30,
        linkCount: 5,
    },
    action: 'warn',
    muteDuration: 10,
    warnMessage: '检测到刷屏行为，请注意发言频率',
    whitelist: [],
    groupWhitelist: [],
    groupConfigs: {},
};

export function buildConfigSchema(ctx: any): any[] {
    return ctx.NapCatConfig.combine(
        ctx.NapCatConfig.html(`
            <div style="padding: 16px; background: #FB7299; border-radius: 12px; margin-bottom: 20px; color: white;">
                <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 600;">群聊刷屏检测</h3>
                <p style="margin: 0; font-size: 13px; opacity: 0.85;">检测群聊中的刷屏行为并自动处理</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">交流群: 649909855</p>
            </div>
        `),
        ctx.NapCatConfig.boolean('enabled', '启用插件', true, '是否启用刷屏检测功能'),
        ctx.NapCatConfig.boolean('debug', '调试模式', false, '启用后输出详细日志'),
        ctx.NapCatConfig.select('action', '处理方式', [
            { label: '仅警告', value: 'warn' },
            { label: '禁言', value: 'mute' },
            { label: '踢出', value: 'kick' },
        ], 'warn', '检测到刷屏时的处理方式'),
        ctx.NapCatConfig.number('muteDuration', '禁言时长（分钟）', 10, '禁言处理时的禁言时长'),
        ctx.NapCatConfig.text('warnMessage', '警告消息', '检测到刷屏行为，请注意发言频率', '发送给刷屏用户的警告消息'),
        ctx.NapCatConfig.text('whitelist', '白名单用户', '', '不检测的用户QQ号，多个用逗号分隔'),
        ctx.NapCatConfig.text('groupWhitelist', '群白名单', '', '只检测这些群，多个用逗号分隔，为空则检测所有群'),
        // 重复消息检测
        ctx.NapCatConfig.html('<div style="margin: 16px 0 8px; font-weight: 600; color: #333;">重复消息检测</div>'),
        ctx.NapCatConfig.number('spam.repeatWindow', '时间窗口（秒）', 5, '检测重复消息的时间范围'),
        ctx.NapCatConfig.number('spam.repeatCount', '触发次数', 3, '时间窗口内发送相同消息的次数'),
        // 消息频率检测
        ctx.NapCatConfig.html('<div style="margin: 16px 0 8px; font-weight: 600; color: #333;">消息频率检测</div>'),
        ctx.NapCatConfig.number('spam.frequencyWindow', '时间窗口（秒）', 10, '检测消息频率的时间范围'),
        ctx.NapCatConfig.number('spam.frequencyCount', '触发次数', 10, '时间窗口内发送消息的次数'),
        // 相似消息检测
        ctx.NapCatConfig.html('<div style="margin: 16px 0 8px; font-weight: 600; color: #333;">相似消息检测</div>'),
        ctx.NapCatConfig.number('spam.similarityThreshold', '相似度阈值', 0.8, '消息相似度阈值（0-1）'),
        ctx.NapCatConfig.number('spam.similarityWindow', '时间窗口（秒）', 10, '检测相似消息的时间范围'),
        ctx.NapCatConfig.number('spam.similarityCount', '触发次数', 3, '时间窗口内相似消息的次数'),
        // 关键词重复检测
        ctx.NapCatConfig.html('<div style="margin: 16px 0 8px; font-weight: 600; color: #333;">关键词重复检测</div>'),
        ctx.NapCatConfig.number('spam.keywordWindow', '时间窗口（秒）', 30, '检测关键词重复的时间范围'),
        ctx.NapCatConfig.number('spam.keywordCount', '触发次数', 5, '时间窗口内同一关键词出现次数'),
        // 媒体刷屏检测
        ctx.NapCatConfig.html('<div style="margin: 16px 0 8px; font-weight: 600; color: #333;">媒体刷屏检测</div>'),
        ctx.NapCatConfig.number('spam.mediaWindow', '时间窗口（秒）', 30, '检测媒体刷屏的时间范围'),
        ctx.NapCatConfig.number('spam.mediaCount', '触发次数', 5, '时间窗口内发送图片/视频的次数'),
        // @刷屏检测
        ctx.NapCatConfig.html('<div style="margin: 16px 0 8px; font-weight: 600; color: #333;">@刷屏检测</div>'),
        ctx.NapCatConfig.number('spam.atSingleLimit', '单条@人数上限', 5, '单条消息@人数超过此值触发'),
        ctx.NapCatConfig.number('spam.atWindow', '时间窗口（秒）', 30, '检测@刷屏的时间范围'),
        ctx.NapCatConfig.number('spam.atWindowLimit', '窗口@人数上限', 10, '时间窗口内@总人数超过此值触发'),
        // 链接刷屏检测
        ctx.NapCatConfig.html('<div style="margin: 16px 0 8px; font-weight: 600; color: #333;">链接刷屏检测</div>'),
        ctx.NapCatConfig.number('spam.linkWindow', '时间窗口（秒）', 30, '检测链接刷屏的时间范围'),
        ctx.NapCatConfig.number('spam.linkCount', '触发次数', 5, '时间窗口内发送链接的次数')
    );
}
