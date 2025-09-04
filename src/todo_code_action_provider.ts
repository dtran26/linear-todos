import * as vscode from "vscode";

import type { TodoManager } from "./todo_manager";

export class TodoCodeActionProvider implements vscode.CodeActionProvider {
	constructor(private todoManager: TodoManager) {}

	async provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		_context: vscode.CodeActionContext,
		_token: vscode.CancellationToken,
	): Promise<vscode.CodeAction[]> {
		const actions: vscode.CodeAction[] = [];

		// Check if there's a TODO at the current position
		const position = range.start;
		const todoItem = this.todoManager.getTodoAtPosition(document, position);

		if (todoItem) {
			if (!todoItem.linearIssueId) {
				// Create action for creating Linear issue
				const createIssueAction = new vscode.CodeAction(
					"Create Linear Issue from TODO",
					vscode.CodeActionKind.QuickFix,
				);
				createIssueAction.command = {
					command: "linear-todos.createIssue",
					title: "Create Linear Issue from TODO",
					arguments: [document.uri, position],
				};
				createIssueAction.isPreferred = true;
				actions.push(createIssueAction);
			} else {
				// Create action for opening existing Linear issue
				const openIssueAction = new vscode.CodeAction(
					`Open Linear Issue: ${todoItem.linearIssueId}`,
					vscode.CodeActionKind.QuickFix,
				);
				openIssueAction.command = {
					command: "linear-todos.openIssue",
					title: "Open Linear Issue",
					arguments: [todoItem.linearIssueId],
				};
				actions.push(openIssueAction);
			}
		} else {
			// Check if the line contains a potential TODO pattern
			const line = document.lineAt(position.line);
			const todoPatterns = vscode.workspace
				.getConfiguration("linearTodos")
				.get<string[]>("todoPatterns", ["TODO", "FIXME", "HACK", "XXX", "BUG"]);

			for (const pattern of todoPatterns) {
				const regex = new RegExp(`\\b${pattern}\\b`, "i");
				if (regex.test(line.text)) {
					const createIssueAction = new vscode.CodeAction(
						"Create Linear Issue from TODO",
						vscode.CodeActionKind.QuickFix,
					);
					createIssueAction.command = {
						command: "linear-todos.createIssue",
						title: "Create Linear Issue from TODO",
						arguments: [document.uri, position],
					};
					actions.push(createIssueAction);
					break;
				}
			}
		}

		return actions;
	}
}
