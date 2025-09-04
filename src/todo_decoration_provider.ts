import * as vscode from "vscode";
import type { TodoManager } from "./todo_manager";

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

	dispose(): void {
		this.decorationType.dispose();
		this.linkedDecorationType.dispose();
	}
}
