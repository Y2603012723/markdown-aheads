/*
 * @Author: ykubuntu2204 y2603012723@163.com
 * @Date: 2025-03-25 16:02:00
 * @LastEditors: ykubuntu2204 y2603012723@163.com
 * @LastEditTime: 2025-04-24 17:10:33
 * @FilePath: /markdown-aheads/src/extension.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { workspace } from "vscode";
import { MarkdownIndex } from './MarkdownIndex';
import { MarkdownTitleUpDown } from './MarkdownTitleUpDown';
import { TOCTool } from './TOCtool';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations111, your extension "markdown-aheads" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('markdown-aheads.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user

        const configuration = workspace.getConfiguration("markdownAheads");
        let configStartingLevelOfSerialNumber = configuration.get<number>("StartingLevelOfSerialNumber");
        // 添加整数验证并使用组合条件表达式
        if (configStartingLevelOfSerialNumber && Number.isInteger(configStartingLevelOfSerialNumber) && configStartingLevelOfSerialNumber > 0 && configStartingLevelOfSerialNumber < 6) {

        } else {
            configStartingLevelOfSerialNumber = 2;
        }
        console.log("configStartingLevelOfSerialNumber: " + configStartingLevelOfSerialNumber);

        let configTitleStartIdentification = configuration.get<string>("TitleStartIdentification");
        // 添加字符串验证并使用组合条件表达式
        if (configTitleStartIdentification && typeof configTitleStartIdentification === "string" && configTitleStartIdentification.length > 0) {
        } else {
            configTitleStartIdentification = "#";
        }
        console.log("configTitleStartIdentification: " + configTitleStartIdentification);

        vscode.window.showInformationMessage('Hello World from markdown-aheads!');
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(vscode.commands.registerCommand('markdown-aheads.addMarkdownIndex', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No open text editor');
            return; // No open text editor
        }

        var selection = editor.selection;
        var text = editor.document.getText(selection);
        var lines: string[];
        if (text.length === 0) {
            // use all text if no selection
            lines = editor.document.getText().split("\n");
            selection = new vscode.Selection(0, 0, lines.length, 0);
        } else {
            lines = text.split("\n");
        }

        // apply plugin
        const markdownIndex = new MarkdownIndex();
        markdownIndex.addMarkdownIndex(lines);

        editor.edit(function (builder: vscode.TextEditorEdit) {
            var resultText = lines.join("\n");
            builder.replace(new vscode.Range(selection.start, selection.end), resultText);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('markdown-aheads.removeMarkdownIndex', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No open text editor');
            return; // No open text editor
        }

        var selection = editor.selection;
        var text = editor.document.getText(selection);
        var lines: string[];
        if (text.length === 0) {
            // use all text if no selection
            lines = editor.document.getText().split("\n");
            selection = new vscode.Selection(0, 0, lines.length, 0);
        } else {
            lines = text.split("\n");
        }

        // apply plugin
        const markdownIndex = new MarkdownIndex();
        let newlines = markdownIndex.removeMarkdownIndex(lines);

        editor.edit(function (builder: vscode.TextEditorEdit) {
            var resultText = newlines.join("\n");
            builder.replace(new vscode.Range(selection.start, selection.end), resultText);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('markdown-aheads.TitleUpgrade', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No open text editor');
            return; // No open text editor
        }
        const currentLine = editor.selection.active.line;
        const processor = new MarkdownTitleUpDown(
            editor.document.getText().split("\n"),
            currentLine
        );

        if (processor.isMaxLevel()) {
            vscode.window.showInformationMessage("已达最高级别（#），无法继续升级");
            return;
        }

        const newContent = processor.process('up');
        editor.edit(edit => {
            // 修复点1：添加非空断言操作符
            const range = new vscode.Range(
                0,
                0,
                editor!.document.lineCount,  // 使用!断言
                0
            );
            // 修复点2：更安全的范围生成方式
            edit.replace(range, newContent.join("\n"));
        });

    }));

    context.subscriptions.push(vscode.commands.registerCommand('markdown-aheads.TitleDowngrade', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No open text editor');
            return; // No open text editor
        }
        const currentLine = editor.selection.active.line;
        const processor = new MarkdownTitleUpDown(
            editor.document.getText().split("\n"),
            currentLine
        );

        if (processor.hasMinLevelInChildren()) {
            vscode.window.showInformationMessage("存在已达最低级别（######）的子标题，无法继续降级");
            return;
        }

        const newContent = processor.process('down');
        editor.edit(edit => {
            // 修复点1：添加非空断言操作符
            const range = new vscode.Range(
                0,
                0,
                editor!.document.lineCount,  // 使用!断言
                0
            );
            // 修复点2：更安全的范围生成方式
            edit.replace(range, newContent.join("\n"));
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('markdown-aheads.TOCCreate', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        const config = workspace.getConfiguration("markdownAheads");
        const startLevel = config.get<number>("StartingLevelOfSerialNumber") || 2;
        const toCTool = new TOCTool();
        const lines = editor.document.getText().split("\n");
        const toc = toCTool.generateTOC(lines, startLevel);

        editor.edit(edit => {
            const pos = editor.selection.active;
            // edit.insert(new vscode.Position(pos.line, 0), toc.join("\n") + "\n\n");
            edit.insert(new vscode.Position(pos.line, 0), toc.join("\n") + "\n");
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('markdown-aheads.TOCUpdate', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        const config = workspace.getConfiguration("markdownAheads");
        const startLevel = config.get<number>("StartingLevelOfSerialNumber") || 2;
        const toCTool = new TOCTool();
        const lines = editor.document.getText().split("\n");
        const newContent = toCTool.processTOC(lines, 'update', startLevel);

        editor.edit(edit => {
            const range = new vscode.Range(0, 0, editor.document.lineCount, 0);
            edit.replace(range, newContent.join("\n"));
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('markdown-aheads.TOCDelete', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
        const toCTool = new TOCTool();
        const lines = editor.document.getText().split("\n");
        const newContent = toCTool.processTOC(lines, 'delete', 0);

        editor.edit(edit => {
            const range = new vscode.Range(0, 0, editor.document.lineCount, 0);
            edit.replace(range, newContent.join("\n"));
        });
    }));

}

// This method is called when your extension is deactivated
export function deactivate() { }
