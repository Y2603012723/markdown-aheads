/*
 * @Author: ykubuntu2204 y2603012723@163.com
 * @Date: 2025-03-26 13:22:58
 * @LastEditors: ykubuntu2204 y2603012723@163.com
 * @LastEditTime: 2025-03-26 16:07:20
 * @FilePath: /markdown-aheads/src/TOCtool.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
export class TOCTool {
    private readonly TOC_START = '<!-- TOC -->';
    private readonly TOC_END = '<!-- /TOC -->';
    private slugCounts: Record<string, number> = {};

    public generateTOC(lines: string[], startLevel: number): string[] {
        const toc: string[] = [this.TOC_START, ''];
        let isInCodeBlock = false;
        this.slugCounts = {}; // 重置计数器

        lines.forEach(line => {
            if (line.startsWith('```')) {isInCodeBlock = !isInCodeBlock;}
            if (isInCodeBlock) {return;}

            if (line.startsWith('#')) {
                const levelMatch = line.match(/^(#+)\s/);
                if (levelMatch) {
                    const level = levelMatch[1].length;
                    //如果正好是标题开始级别的上一级
                    if(level - startLevel === -1){
                        // toc.push("*\n*\n*\n");
                        toc.push("\n");
                        // toc.push(line);
                        // toc.push(line.replace(/^#+\s/, '').trim());
                    }
                    if (level >= startLevel && level <= 6) {
                        const depth = level - startLevel;
                        if (depth >= 0) {
                            const title = line.replace(/^#+\s/, '').trim();
                            let slug = this.slug(title);
                            
                            // 处理重复标题
                            if (this.slugCounts[slug]) {
                                const count = this.slugCounts[slug]++;
                                slug = `${slug}-${count}`;
                            } else {
                                this.slugCounts[slug] = 1;
                            }

                            const indent = '  '.repeat(depth);
                            toc.push(`${indent}- [${title}](#${slug})`);
                        }
                    }
                }
            }
        });

        toc.push('', this.TOC_END);
        return toc;
    }

    // 更新或删除目录
    public processTOC(lines: string[], operation: 'update'|'delete', startLevel: number): string[] {
        let inTOC = false;
        const newLines: string[] = [];
        
        lines.forEach(line => {
            if (line === this.TOC_START) {
                inTOC = true;
                if (operation === 'update') {
                    newLines.push(...this.generateTOC(lines, startLevel));
                }
            }
            
            if (!inTOC) {
                newLines.push(line);
            }
            
            if (line === this.TOC_END) {
                inTOC = false;
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