/*
 * @Author: ykubuntu2204 y2603012723@163.com
 * @Date: 2025-03-26 10:41:42
 * @LastEditors: ykubuntu2204 y2603012723@163.com
 * @LastEditTime: 2025-03-26 12:06:16
 * @FilePath: /markdown-aheads/src/MarkdownTitleUpDown.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { workspace } from "vscode";

export class MarkdownTitleUpDown {
    private content: string[];
    private currentLine: number;
    private indexBase: string = "#";

    constructor(content: string[], currentLine: number) {
        this.content = [...content];
        this.currentLine = currentLine;
        this._loadConfig();
    }

    private _loadConfig() {
        const configuration = workspace.getConfiguration("markdownAheads");
        const configTitleStart = configuration.get<string>("TitleStartIdentification") || "#";
        this.indexBase = configTitleStart;
    }

    //校验是否达到最大级别
    public isMaxLevel(): boolean {
        return this._getCurrentTitleLevel() === 1;
    }

    //获取当前标题级别
    private _getCurrentTitleLevel(): number {
        const currentLineText = this.content[this.currentLine];
        const [_, level] = this._parseTitleLine(currentLineText);
        return level;
    }


    //校验子标题是否包含最低级别
    public hasMinLevelInChildren(): boolean {
        const currentLevel = this._getCurrentTitleLevel();
        const targetLines = this._collectChildLines(this.currentLine, currentLevel);
        return targetLines.some(line => {
            const [_, level] = this._parseTitleLine(this.content[line]);
            return level >= 6;
        });
    }

    // 核心处理方法
    public process(operation: 'up'|'down'): string[] {
        const currentLineText = this.content[this.currentLine];
        if (!this._isTitleLine(currentLineText)) {return this.content;}
        
        // 修复点1：添加完整的结构解构
        const [baseIndent, baseLevel, baseContent] = this._parseTitleLine(currentLineText);
        if (baseLevel < 1) {return this.content;} // 修复点2：修改判断条件

        // 收集所有需要修改的标题行
        const targetLines = this._collectChildLines(this.currentLine, baseLevel);
        
        // 执行修改
        targetLines.forEach(lineIndex => {
            const [indent, level, content] = this._parseTitleLine(this.content[lineIndex]);
            const newLevel = operation === 'up' 
                ? Math.max(1, level - 1) 
                : Math.min(6, level + 1);
            
            this.content[lineIndex] = `${indent}${this.indexBase.repeat(newLevel)} ${content}`;
        });

        return this.content;
    }

    // 解析标题行结构（修复正则表达式）
    /**
     * 解析Markdown标题行结构
     * @param line 需要解析的文本行
     * @returns 元组 [缩进空格, 标题级别, 标题内容]
     * 
     * 正则表达式分解：
     * 1. ^(\s*)        -> 匹配行首的空格缩进
     * 2. (${escapedBase}+) -> 匹配由配置符号组成的标题标识（如#、##等）
     * 3. \s+           -> 至少一个空白字符分隔
     * 4. (.*)          -> 捕获剩余内容作为标题文本
     */
    private _parseTitleLine(line: string): [string, number, string] {
        //对this.indexBase中的特殊字符进行正则表达式转义
        const escapedBase = this.indexBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = line.match(new RegExp(`^(\\s*)(${escapedBase}+)\\s+(.*)`));
        return match ? [match[1], match[2].length, match[3]] : ['', 0, ''];
    }

    // 判断是否是有效标题行
    private _isTitleLine(line: string): boolean {
        return line.startsWith(this.indexBase) && !line.startsWith(this.indexBase.repeat(7));
    }

    // 递归收集子标题
    private _collectChildLines(startLine: number, baseLevel: number): number[] {
        const result: number[] = [startLine];
        let isInCodeBlock = false;  // 新增代码块状态跟踪
        
        for (let i = startLine + 1; i < this.content.length; i++) {
            const lineText = this.content[i];
            
            // 修复点：正确处理代码块边界
            if (lineText.startsWith('```')) {
                isInCodeBlock = !isInCodeBlock;
                continue;
            }
            if (isInCodeBlock) continue;
            
            if (this._isTitleLine(lineText)) {
                const [_, level] = this._parseTitleLine(lineText);
                
                // 修复点：仅当遇到更高层级标题时才继续
                if (level <= baseLevel) {
                    // 仅在非代码块状态下才会终止收集
                    if (!isInCodeBlock) break;
                    continue;
                }
                
                result.push(i);
                // 递归时不重置代码块状态
                result.push(...this._collectChildLines(i, level));
            }
        }
        return [...new Set(result)];
    }
}