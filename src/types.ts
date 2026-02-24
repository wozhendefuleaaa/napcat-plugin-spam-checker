/**
 * 群聊刷屏检测插件类型定义
 */

/** 刷屏检测配置 */
export interface SpamConfig {
    /** 重复消息检测：时间窗口（秒） */
    repeatWindow: number;
    /** 重复消息检测：触发次数 */
    repeatCount: number;
    /** 消息频率检测：时间窗口（秒） */
    frequencyWindow: number;
    /** 消息频率检测：触发次数 */
    frequencyCount: number;
    /** 相似消息检测：相似度阈值 */
    similarityThreshold: number;
    /** 相似消息检测：时间窗口（秒） */
    similarityWindow: number;
    /** 相似消息检测：触发次数 */
    similarityCount: number;
    /** 关键词重复检测：时间窗口（秒） */
    keywordWindow: number;
    /** 关键词重复检测：触发次数 */
    keywordCount: number;
    /** 媒体刷屏检测：时间窗口（秒） */
    mediaWindow: number;
    /** 媒体刷屏检测：触发次数 */
    mediaCount: number;
    /** @刷屏检测：单条消息@人数上限 */
    atSingleLimit: number;
    /** @刷屏检测：时间窗口（秒） */
    atWindow: number;
    /** @刷屏检测：时间窗口内@人数上限 */
    atWindowLimit: number;
    /** 链接刷屏检测：时间窗口（秒） */
    linkWindow: number;
    /** 链接刷屏检测：触发次数 */
    linkCount: number;
}

/** 插件主配置 */
export interface PluginConfig {
    enabled: boolean;
    debug: boolean;
    /** 刷屏检测配置 */
    spam: SpamConfig;
    /** 检测到刷屏时的处理方式: warn=警告, mute=禁言, kick=踢出 */
    action: 'warn' | 'mute' | 'kick';
    /** 禁言时长（分钟） */
    muteDuration: number;
    /** 警告消息模板 */
    warnMessage: string;
    /** 白名单用户（不检测） */
    whitelist: string[];
    /** 群白名单（只检测这些群，为空则检测所有群） */
    groupWhitelist: string[];
    /** 按群的单独配置 */
    groupConfigs: Record<string, GroupConfig>;
}

/** 群配置 */
export interface GroupConfig {
    enabled?: boolean;
}

/** 消息记录 */
export interface MessageRecord {
    userId: string;
    groupId: string;
    content: string;
    timestamp: number;
    hasMedia: boolean;
    atCount: number;
    hasLink: boolean;
}

/** API响应 */
export interface ApiResponse<T = unknown> {
    code: number;
    message?: string;
    data?: T;
}
