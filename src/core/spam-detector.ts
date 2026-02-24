/**
 * 刷屏检测核心逻辑
 */

import { pluginState } from './state';
import type { MessageRecord, SpamConfig } from '../types';

/** 计算两个字符串的相似度 (Levenshtein) */
function similarity(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    if (!s1.length || !s2.length) return 0;
    
    const len1 = s1.length, len2 = s2.length;
    const dp: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            dp[i][j] = s1[i-1] === s2[j-1] 
                ? dp[i-1][j-1] 
                : Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1;
        }
    }
    
    return 1 - dp[len1][len2] / Math.max(len1, len2);
}

/** 提取消息中的关键词 */
function extractKeywords(content: string): string[] {
    return content.match(/[\u4e00-\u9fa5a-zA-Z]{2,}/g) || [];
}

export type SpamType = 'repeat' | 'frequency' | 'similarity' | 'keyword' | 'media' | 'at_single' | 'at_window' | 'link';

export interface SpamCheckResult {
    isSpam: boolean;
    type?: SpamType;
    detail?: string;
}

/** 检测刷屏 */
export function checkSpam(record: MessageRecord, records: MessageRecord[]): SpamCheckResult {
    const cfg = pluginState.config.spam;
    const now = record.timestamp;

    // 1. 重复消息检测
    const repeatRecords = records.filter(r => 
        now - r.timestamp < cfg.repeatWindow * 1000 && r.content === record.content
    );
    if (repeatRecords.length >= cfg.repeatCount - 1) {
        return { isSpam: true, type: 'repeat', detail: `${cfg.repeatWindow}秒内发送${repeatRecords.length + 1}条相同消息` };
    }

    // 2. 消息频率检测
    const freqRecords = records.filter(r => now - r.timestamp < cfg.frequencyWindow * 1000);
    if (freqRecords.length >= cfg.frequencyCount - 1) {
        return { isSpam: true, type: 'frequency', detail: `${cfg.frequencyWindow}秒内发送${freqRecords.length + 1}条消息` };
    }

    // 3. 相似消息检测
    const simRecords = records.filter(r => 
        now - r.timestamp < cfg.similarityWindow * 1000 && 
        similarity(r.content, record.content) >= cfg.similarityThreshold
    );
    if (simRecords.length >= cfg.similarityCount - 1) {
        return { isSpam: true, type: 'similarity', detail: `${cfg.similarityWindow}秒内发送${simRecords.length + 1}条相似消息` };
    }

    // 4. 关键词重复检测
    const keywords = extractKeywords(record.content);
    for (const kw of keywords) {
        const kwRecords = records.filter(r => 
            now - r.timestamp < cfg.keywordWindow * 1000 && r.content.includes(kw)
        );
        if (kwRecords.length >= cfg.keywordCount - 1) {
            return { isSpam: true, type: 'keyword', detail: `${cfg.keywordWindow}秒内关键词"${kw}"出现${kwRecords.length + 1}次` };
        }
    }

    // 5. 媒体刷屏检测
    if (record.hasMedia) {
        const mediaRecords = records.filter(r => now - r.timestamp < cfg.mediaWindow * 1000 && r.hasMedia);
        if (mediaRecords.length >= cfg.mediaCount - 1) {
            return { isSpam: true, type: 'media', detail: `${cfg.mediaWindow}秒内发送${mediaRecords.length + 1}次图片/视频` };
        }
    }

    // 6. @刷屏检测 - 单条消息
    if (record.atCount >= cfg.atSingleLimit) {
        return { isSpam: true, type: 'at_single', detail: `单条消息@了${record.atCount}人` };
    }

    // 7. @刷屏检测 - 时间窗口
    const atRecords = records.filter(r => now - r.timestamp < cfg.atWindow * 1000);
    const totalAt = atRecords.reduce((sum, r) => sum + r.atCount, 0) + record.atCount;
    if (totalAt >= cfg.atWindowLimit) {
        return { isSpam: true, type: 'at_window', detail: `${cfg.atWindow}秒内@了${totalAt}人` };
    }

    // 8. 链接刷屏检测
    if (record.hasLink) {
        const linkRecords = records.filter(r => now - r.timestamp < cfg.linkWindow * 1000 && r.hasLink);
        if (linkRecords.length >= cfg.linkCount - 1) {
            return { isSpam: true, type: 'link', detail: `${cfg.linkWindow}秒内发送${linkRecords.length + 1}次链接` };
        }
    }

    return { isSpam: false };
}
