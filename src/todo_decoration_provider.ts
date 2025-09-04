import * as vscode from "vscode";
import type { TodoManager } from "./todo_manager";
import type { TodoItem } from "./types";

export class TodoDecorationProvider {
	private readonly decorationType: vscode.TextEditorDecorationType;
	private readonly linkedDecorationType: vscode.TextEditorDecorationType;

	constructor(private todoManager: TodoManager) {
		this.decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: "rgba(255, 193, 7, 0.3)",
			border: "1px solid rgba(255, 193, 7, 0.7)",
			borderRadius: "3px",
			overviewRulerColor: "rgba(255, 193, 7, 0.8)",
			overviewRulerLane: vscode.OverviewRulerLane.Right,
		});

		this.linkedDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: "rgba(59, 130, 246, 0.3)",
			border: "1px solid rgba(59, 130, 246, 0.7)",
			borderRadius: "3px",
			overviewRulerColor: "rgba(59, 130, 246, 0.8)",
			overviewRulerLane: vscode.OverviewRulerLane.Right,
		});
	}

	async updateDecorations(): Promise<void> {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const config = vscode.workspace.getConfiguration("linearTodos");
		if (!config.get("autoHighlight", true)) {
			return;
		}

		const document = editor.document;
		const todos = await this.todoManager.scanDocument(document);

		const unlinkedDecorations: vscode.DecorationOptions[] = [];
		const linkedDecorations: vscode.DecorationOptions[] = [];

		todos.forEach((todo) => {
			const decoration: vscode.DecorationOptions = {
				range: todo.range,
				hoverMessage: this.createHoverMessage(todo),
			};

			if (todo.linearIssueId) {
				linkedDecorations.push(decoration);
			} else {
				unlinkedDecorations.push(decoration);
			}
		});

		editor.setDecorations(this.decorationType, unlinkedDecorations);
		editor.setDecorations(this.linkedDecorationType, linkedDecorations);
	}

	private createHoverMessage(todo: TodoItem): vscode.MarkdownString {
		const markdown = new vscode.MarkdownString();
		markdown.isTrusted = true;

		if (todo.linearIssueId) {
			markdown.appendMarkdown(
				`**Linked Linear Issue:** [${todo.linearIssueId}](command:linear-todos.openIssue?${encodeURIComponent(JSON.stringify([todo.linearIssueId]))})\n\n`,
			);
		} else {
			markdown.appendMarkdown(`**TODO Item** (Priority: ${todo.priority})\n\n`);
			markdown.appendMarkdown(
				`[Create Linear Issue](command:linear-todos.createIssue)\n\n`,
			);
		}

		markdown.appendMarkdown(`**Type:** ${todo.pattern}\n\n`);
		markdown.appendMarkdown(`**Text:** ${todo.text}\n\n`);
		markdown.appendMarkdown(`**File:** ${todo.file}\n\n`);
		markdown.appendMarkdown(`**Line:** ${todo.line + 1}\n\n`);

		return markdown;
	}

	dispose(): void {
		this.decorationType.dispose();
		this.linkedDecorationType.dispose();
	}
}
