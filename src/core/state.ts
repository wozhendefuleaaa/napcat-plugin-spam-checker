/**
 * 全局状态管理
 */

import fs from 'fs';
import path from 'path';
import { DEFAULT_CONFIG } from '../config';
import type { PluginConfig, MessageRecord, SpamConfig, GroupConfig } from '../types';

function isObject(v: unknown): v is Record<string, unknown> {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function sanitizeSpamConfig(raw: unknown): SpamConfig {
    const def = DEFAULT_CONFIG.spam;
    if (!isObject(raw)) return { ...def };
    return {
        repeatWindow: typeof raw.repeatWindow === 'number' ? raw.repeatWindow : def.repeatWindow,
        repeatCount: typeof raw.repeatCount === 'number' ? raw.repeatCount : def.repeatCount,
        frequencyWindow: typeof raw.frequencyWindow === 'number' ? raw.frequencyWindow : def.frequencyWindow,
        frequencyCount: typeof raw.frequencyCount === 'number' ? raw.frequencyCount : def.frequencyCount,
        similarityThreshold: typeof raw.similarityThreshold === 'number' ? raw.similarityThreshold : def.similarityThreshold,
        similarityWindow: typeof raw.similarityWindow === 'number' ? raw.similarityWindow : def.similarityWindow,
        similarityCount: typeof raw.similarityCount === 'number' ? raw.similarityCount : def.similarityCount,
        keywordWindow: typeof raw.keywordWindow === 'number' ? raw.keywordWindow : def.keywordWindow,
        keywordCount: typeof raw.keywordCount === 'number' ? raw.keywordCount : def.keywordCount,
        mediaWindow: typeof raw.mediaWindow === 'number' ? raw.mediaWindow : def.mediaWindow,
        mediaCount: typeof raw.mediaCount === 'number' ? raw.mediaCount : def.mediaCount,
        atSingleLimit: typeof raw.atSingleLimit === 'number' ? raw.atSingleLimit : def.atSingleLimit,
        atWindow: typeof raw.atWindow === 'number' ? raw.atWindow : def.atWindow,
        atWindowLimit: typeof raw.atWindowLimit === 'number' ? raw.atWindowLimit : def.atWindowLimit,
        linkWindow: typeof raw.linkWindow === 'number' ? raw.linkWindow : def.linkWindow,
        linkCount: typeof raw.linkCount === 'number' ? raw.linkCount : def.linkCount,
    };
}

function sanitizeConfig(raw: unknown): PluginConfig {
    if (!isObject(raw)) return { ...DEFAULT_CONFIG, spam: { ...DEFAULT_CONFIG.spam }, groupConfigs: {} };

    const out: PluginConfig = { ...DEFAULT_CONFIG, spam: sanitizeSpamConfig(raw.spam), groupConfigs: {} };

    if (typeof raw.enabled === 'boolean') out.enabled = raw.enabled;
    if (typeof raw.debug === 'boolean') out.debug = raw.debug;
    if (raw.action === 'warn' || raw.action === 'mute' || raw.action === 'kick') out.action = raw.action;
    if (typeof raw.muteDuration === 'number') out.muteDuration = raw.muteDuration;
    if (typeof raw.warnMessage === 'string') out.warnMessage = raw.warnMessage;
    if (Array.isArray(raw.whitelist)) out.whitelist = raw.whitelist.filter((x): x is string => typeof x === 'string');
    else if (typeof raw.whitelist === 'string') out.whitelist = raw.whitelist.split(',').map(s => s.trim()).filter(Boolean);

    if (isObject(raw.groupConfigs)) {
        for (const [groupId, groupConfig] of Object.entries(raw.groupConfigs)) {
            if (isObject(groupConfig)) {
                const cfg: GroupConfig = {};
                if (typeof groupConfig.enabled === 'boolean') cfg.enabled = groupConfig.enabled;
                out.groupConfigs[groupId] = cfg;
            }
        }
    }

    return out;
}

class PluginState {
    private _ctx: any = null;
    config: PluginConfig = { ...DEFAULT_CONFIG, spam: { ...DEFAULT_CONFIG.spam } };
    
    /** 消息记录缓存: groupId -> userId -> MessageRecord[] */
    messageCache: Map<string, Map<string, MessageRecord[]>> = new Map();
    
    /** 清理定时器 */
    cleanupTimer: ReturnType<typeof setInterval> | null = null;

    get ctx(): any {
        if (!this._ctx) throw new Error('PluginState 尚未初始化');
        return this._ctx;
    }

    get logger(): any {
        return this.ctx.logger;
    }

    init(ctx: any): void {
        this._ctx = ctx;
        this.loadConfig();
        // 每分钟清理过期消息记录
        this.cleanupTimer = setInterval(() => this.cleanExpiredRecords(), 60000);
    }

    cleanup(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.messageCache.clear();
    }

    private getConfigPath(): string {
        return path.join(this.ctx.pluginDataPath, 'config.json');
    }

    loadConfig(): void {
        try {
            const configPath = this.getConfigPath();
            if (fs.existsSync(configPath)) {
                const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                this.config = sanitizeConfig(raw);
            }
        } catch (e) {
            this.logger.error('加载配置失败:', e);
        }
    }

    saveConfig(): void {
        try {
            const configPath = this.getConfigPath();
            const dir = path.dirname(configPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
        } catch (e) {
            this.logger.error('保存配置失败:', e);
        }
    }

    updateConfig(partial: Partial<PluginConfig>): void {
        Object.assign(this.config, partial);
        this.saveConfig();
    }

    /** 添加消息记录 */
    addRecord(record: MessageRecord): void {
        if (!this.messageCache.has(record.groupId)) {
            this.messageCache.set(record.groupId, new Map());
        }
        const groupCache = this.messageCache.get(record.groupId)!;
        if (!groupCache.has(record.userId)) {
            groupCache.set(record.userId, []);
        }
        groupCache.get(record.userId)!.push(record);
    }

    /** 获取用户在群内的消息记录 */
    getRecords(groupId: string, userId: string): MessageRecord[] {
        return this.messageCache.get(groupId)?.get(userId) || [];
    }

    /** 清理过期记录 */
    cleanExpiredRecords(): void {
        const maxWindow = Math.max(
            this.config.spam.repeatWindow,
            this.config.spam.frequencyWindow,
            this.config.spam.similarityWindow,
            this.config.spam.keywordWindow,
            this.config.spam.mediaWindow,
            this.config.spam.atWindow,
            this.config.spam.linkWindow
        ) * 1000;
        const now = Date.now();
        
        for (const [groupId, groupCache] of this.messageCache) {
            for (const [userId, records] of groupCache) {
                const filtered = records.filter(r => now - r.timestamp < maxWindow);
                if (filtered.length === 0) {
                    groupCache.delete(userId);
                } else {
                    groupCache.set(userId, filtered);
                }
            }
            if (groupCache.size === 0) {
                this.messageCache.delete(groupId);
            }
        }
    }
}

export const pluginState = new PluginState();
