/**
 * 消息处理器
 */

import { pluginState } from '../core/state';
import { checkSpam } from '../core/spam-detector';
import type { MessageRecord } from '../types';

const URL_REGEX = /https?:\/\/[^\s]+/i;

/** 从消息段中提取文本内容 */
function extractText(message: any): string {
    if (typeof message === 'string') return message;
    return message.filter((seg: any) => seg.type === 'text').map((seg: any) => seg.data?.text || '').join('');
}

/** 检查是否包含媒体 */
function hasMedia(message: any): boolean {
    if (typeof message === 'string') return false;
    return message.some((seg: any) => seg.type === 'image' || seg.type === 'video');
}

/** 统计@人数 */
function countAt(message: any): number {
    if (typeof message === 'string') return 0;
    return message.filter((seg: any) => seg.type === 'at').length;
}

/** 检查是否包含链接 */
function hasLink(content: string): boolean {
    return URL_REGEX.test(content);
}

export async function handleMessage(ctx: any, event: any): Promise<void> {
    // 仅处理群消息
    if (event.message_type !== 'group') return;
    
    const groupId = String(event.group_id);
    const userId = String(event.user_id);
    const config = pluginState.config;

    // 检查群是否启用
    const groupConfig = config.groupConfigs[groupId];
    if (groupConfig?.enabled === false) return;

    // 检查白名单
    if (config.whitelist.includes(userId)) return;

    const content = extractText(event.message);
    const record: MessageRecord = {
        userId,
        groupId,
        content,
        timestamp: Date.now(),
        hasMedia: hasMedia(event.message),
        atCount: countAt(event.message),
        hasLink: hasLink(content),
    };

    // 获取历史记录并检测
    const records = pluginState.getRecords(groupId, userId);
    const result = checkSpam(record, records);

    // 添加当前记录
    pluginState.addRecord(record);

    if (!result.isSpam) return;

    if (config.debug) {
        ctx.logger.info(`[刷屏检测] 群${groupId} 用户${userId}: ${result.type} - ${result.detail}`);
    }

    // 执行处理
    try {
        switch (config.action) {
            case 'warn':
                await ctx.sendGroupMsg(Number(groupId), [
                    { type: 'at', data: { qq: userId } },
                    { type: 'text', data: { text: ` ${config.warnMessage}` } }
                ]);
                break;
            case 'mute':
                await ctx.setGroupBan(Number(groupId), Number(userId), config.muteDuration * 60);
                await ctx.sendGroupMsg(Number(groupId), [
                    { type: 'at', data: { qq: userId } },
                    { type: 'text', data: { text: ` ${config.warnMessage}（已禁言${config.muteDuration}分钟）` } }
                ]);
                break;
            case 'kick':
                await ctx.setGroupKick(Number(groupId), Number(userId), false);
                break;
        }
    } catch (e) {
        ctx.logger.error('处理刷屏失败:', e);
    }
}
