/*
 * @Author: ykubuntu2204 y2603012723@163.com
 * @Date: 2025-03-26 13:22:58
 * @LastEditors: ykubuntu2204 y2603012723@163.com
 * @LastEditTime: 2025-04-24 17:23:48
 * @FilePath: /markdown-aheads/src/TOCtool.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
export class TOCTool {
    private slugCounts: Record<string, number> = {};

    /**
     * 生成Markdown目录
     * @param lines 文档内容行数组
     * @param startLevel 目录起始层级（例如2表示从##开始）
     * @returns 生成的目录行数组
     */
    public generateTOC(lines: string[], startLevel: number): string[] {
        const toc: string[] = [];
        let isInCodeBlock = false;
        this.slugCounts = {}; // 重置计数器

        lines.forEach(line => {
            // 检测代码块开始/结束标记
            if (line.startsWith('```')) { isInCodeBlock = !isInCodeBlock; }
            if (isInCodeBlock) { return; } // 跳过代码块中的内容

            if (line.startsWith('#')) {
                const levelMatch = line.match(/^(#+)\s/);
                if (levelMatch) {
                    const level = levelMatch[1].length;
                    // 当遇到起始层级的父级标题时（例如startLevel=2时遇到#标题）
                    // if (level - startLevel === -1) {
                    //     if (toc.length > 1 && toc[toc.length - 1] !== '\n') {
                    //         toc.push('\n');
                    //     }
                    // }

                    // 处理符合层级范围的标题（startLevel到h6）
                    if (level >= startLevel && level <= 6) {
                        const depth = level - startLevel; // 计算相对于起始层级的深度
                        if (depth >= 0) {
                            const title = line.replace(/^#+\s/, '').trim();
                            let slug = this.slug(title);

                            // 处理重复标题的锚点冲突
                            if (this.slugCounts[slug]) {
                                const count = this.slugCounts[slug]++;
                                slug = `${slug}-${count}`; // 追加序号保证唯一性
                            } else {
                                this.slugCounts[slug] = 1;
                            }

                            // 生成带缩进的目录项
                            const indent = '  '.repeat(depth);
                            toc.push(`${indent}- [${title}](#${slug})`);
                        }
                    }
                }
            }
        });

        // toc.push(this.TOC_END);
        return toc;
    }

    // 更新或删除目录
    public processTOC(lines: string[], operation: 'update' | 'delete', startLevel: number): string[] {
        let inTOC = false;
        const newLines: string[] = [];

        lines.forEach(line => {
            // 检测目录项起始模式 (支持带空格的缩进)
            const isTOCLine = /^\s*-\s\[/.test(line);
            if (!inTOC && isTOCLine) {
                inTOC = true;
                if (operation === 'update') {
                    newLines.push(...this.generateTOC(lines, startLevel));
                }
            }

            // 当遇到非目录行且处于目录区域时，结束目录
            if (inTOC && !isTOCLine) {
                inTOC = false;
            }


            if (!inTOC) {
                // 不在目录区域时才保留原行
                if (!isTOCLine || operation !== 'delete') {
                    newLines.push(line);
                }
            }
        });

        return newLines;
    }

    private slug(title: string): string {
        // 改进锚点生成规则
        return title
            .normalize('NFKD') // 分解Unicode字符
            .toLowerCase()
            .replace(/\s+/g, '-')         // 空格转连字符
            .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 保留中文、字母、数字和连字符
            .replace(/-+/g, '-')          // 合并连续连字符
            .replace(/^-+/, '')           // 去除开头连字符
            .replace(/-+$/, '');          // 去除结尾连字符
    }
}