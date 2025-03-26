import { workspace } from "vscode";

/**
 * The main class to add markdown index.
 * 
 * Inspired by firjq (https://github.com/firejq/markdown_index/blob/master/src/MarkdownIndex.ts)
 * 
 * modify by legendmohe
 */
export class MarkdownIndex {

    // 标题开始标识 index base configuration for user, default value is "#"
    private _indexBase: string = "#";

    // 序号开始级别，默认一级标题不加序号，从二级标题开始加序号
    private _startingLevelOfSerialNumber: number = 2;

    constructor() {
        const configuration = workspace.getConfiguration("markdownAheads");
        let configTitleStartIdentification = configuration.get<string>("TitleStartIdentification");
        if (configTitleStartIdentification && typeof configTitleStartIdentification === "string" && configTitleStartIdentification.length > 0) {
            this._indexBase = configTitleStartIdentification;
        }
        let configStartingLevelOfSerialNumber = configuration.get<number>("StartingLevelOfSerialNumber");
        if (configStartingLevelOfSerialNumber && Number.isInteger(configStartingLevelOfSerialNumber) && configStartingLevelOfSerialNumber > 0 && configStartingLevelOfSerialNumber < 6) {
            this._startingLevelOfSerialNumber = configStartingLevelOfSerialNumber;
        }
    }

    private _addPrefix(line: string, prefix: string, markCount: number) {
        // remove previous index
        let markIndex = line.indexOf(this._indexBase);
        if (markIndex === -1) {
            markIndex = 0;
        }
        var re = new RegExp('(^\\s*\\' + this._indexBase + '+)\\s*((\\d+\\.)+)\\s+', "g");
        line = line.replace(re, "$1");
        return line.slice(0, markIndex + markCount)  // 修改为 slice 替代 substr
            + " "
            + prefix
            + " "
            + line.slice(markIndex + markCount).trim(); // 修改为 slice 替代 substr
    }

    private _countStartsWith(fliter: (char: string) => boolean, chars: string[]): number { // 添加类型声明
        let count: number = 0;
        chars.some(element => {
            if (fliter(element)) {
                count++;
                return false;
            } else {
                return true;
            }
        });
        return count;
    }

    // private _addIndex(
    //     content: string[],     // 正在处理的完整文档内容（按行分割的数组）
    //     lastMarkCount: number, // 上一级标题的 # 数量（用于确定嵌套层级）
    //     prefix: string,        // 当前层级的序号前缀（如 "1.2."）
    //     cursor: number         // 当前处理的行号索引（从 0 开始）
    // ): number                 // 返回最后处理的行号索引
    private _addIndex(content: string[], lastMarkCount: number, prefix: string, cursor: number): number {
        // leave the normal line and count this._indexBase
        let targetMarkCount = 0;
        // mark the current line whether is in the ``` code area
        let isInCodeArea = false;

        while (cursor < content.length) {
            let line = content[cursor];

            if (line.startsWith("```")) {
                isInCodeArea = !isInCodeArea;
                cursor++;
                continue;
            }

            if (isInCodeArea === false && line.startsWith(this._indexBase)) {
                // find the start mark count
                targetMarkCount = this._countStartsWith(
                    x => { return x === this._indexBase; },
                    line.split("")
                );
                // 新增级别判断：仅当标题级别达到起始级别时处理
                if (targetMarkCount >= this._startingLevelOfSerialNumber) {
                    break;
                }
            }
            cursor++;

        }

        let seq = 1;
        while (cursor < content.length) {
            let markCount = this._countStartsWith(
                x => { return x === this._indexBase; },
                content[cursor].split("")
            );
            if (markCount >= this._startingLevelOfSerialNumber &&
                markCount === targetMarkCount &&
                markCount > lastMarkCount) {
                let curPrefix = prefix + seq + ".";
                content[cursor] = this._addPrefix(content[cursor], curPrefix, markCount);
                seq++;
                // deep first search
                cursor = this._addIndex(content, markCount, curPrefix, cursor + 1);
            } else if (markCount <= lastMarkCount) {
                // rollback 1 row
                cursor--;
                break;
            }
            cursor++;
        }
        return cursor;
    }

    public addMarkdownIndex(content: string[]): string[] {
        // 用于追踪每个级别的序号
        const levelCounters: number[] = new Array(6).fill(0);
        let isInCodeArea = false;
        let lastLevel = 0;  // 记录上一个标题的级别

        // 遍历每一行
        for (let i = 0; i < content.length; i++) {
            const line = content[i];

            if (line.startsWith("```")) {
                isInCodeArea = !isInCodeArea;
                continue;
            }

            if (isInCodeArea || !line.startsWith(this._indexBase)) {
                continue;
            }

            // 计算当前标题的级别
            const level = this._countStartsWith(
                x => x === this._indexBase,
                line.split("")
            );

 

            if (level < this._startingLevelOfSerialNumber) {
                // 遇到高级标题时重置所有计数器
                levelCounters.fill(0);
                lastLevel = level;
                continue;
            }


            // 修复点：仅重置当前级别及更深层级的计数器
            if (level < lastLevel) {
                // 从当前层级开始重置（保留更高级别的计数器）
                for (let j = level; j < levelCounters.length; j++) {
                    levelCounters[j] = 0;
                }
            }else if(level - lastLevel > 1){
                // 遇到不连续的标题级别,需要把其父级别都加1
                for(let j = lastLevel; j < level-1; j++){
                    levelCounters[j]++;
                }
            }


            // 增加当前级别的计数
            levelCounters[level - 1]++;
            lastLevel = level;

            // 构建完整的层级序号
            let prefix = "";
            let validNumbers = 0;
            for (let j = this._startingLevelOfSerialNumber - 1; j < level; j++) {
                if (levelCounters[j] > 0) {
                    validNumbers++;
                    prefix += levelCounters[j] + ".";
                }
            }

            // 确保序号包含所有层级
            // while (validNumbers < (level - this._startingLevelOfSerialNumber + 1)) {
            //     prefix = "1." + prefix;
            //     validNumbers++;
            // }

            // 更新行内容
            content[i] = this._addPrefix(line, prefix, level);
        }

        return content;
    }

    private _removePrefix(line: string): string {
        // 匹配标题中的序号模式（如：## 1.2.3 文本）
        const re = new RegExp(`(^\\s*\\${this._indexBase}+)\\s+((\\d+\\.)+)\\s`, "g");
        return line.replace(re, "$1 ");
    }

    public removeMarkdownIndex(content: string[]): string[] {
        let isInCodeArea = false;
        return content.map(line => {
            if (line.startsWith("```")) {
                isInCodeArea = !isInCodeArea;
                return line;
            }
            if (!isInCodeArea && line.startsWith(this._indexBase)) {
                return this._removePrefix(line);
            }
            return line;
        });
    }
}