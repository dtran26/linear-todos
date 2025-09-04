import * as vscode from "vscode";
import type { LinearService } from "./linear_service";
import type { TodoItem } from "./types";

export class TodoManager {
	private todos: Map<string, TodoItem[]> = new Map();

	constructor(private linearService: LinearService) {}

	async scanDocument(document: vscode.TextDocument): Promise<TodoItem[]> {
		const todos: TodoItem[] = [];
		const config = vscode.workspace.getConfiguration("linearTodos");
		const patterns = config.get<string[]>("todoPatterns", [
			"TODO",
			"FIXME",
			"HACK",
			"XXX",
			"BUG",
		]);

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			const lineText = line.text;

			for (const pattern of patterns) {
				const regex = new RegExp(`\\b${pattern}\\b:?\\s*(.*)`, "i");
				const match = lineText.match(regex);

				if (match) {
					const todoText = lineText.trim();
					const priority = this.determinePriority(pattern, todoText);
					const context = this.getCodeContext(document, i);
					const linearIssueId = this.extractLinearIssueId(todoText);

					const todoItem: TodoItem = {
						text: todoText,
						pattern,
						range: new vscode.Range(
							new vscode.Position(i, match.index || 0),
							new vscode.Position(i, (match.index || 0) + match[0].length),
						),
						line: i,
						file: vscode.workspace.asRelativePath(document.uri.fsPath),
						linearIssueId,
						priority,
						context,
					};

					todos.push(todoItem);
				}
			}
		}

		const relativePath = vscode.workspace.asRelativePath(document.uri.fsPath);
		this.todos.set(relativePath, todos);
		return todos;
	}

	getTodos(document: vscode.TextDocument): TodoItem[] {
		const relativePath = vscode.workspace.asRelativePath(document.uri.fsPath);
		return this.todos.get(relativePath) || [];
	}

	getTodoAtPosition(
		document: vscode.TextDocument,
		position: vscode.Position,
	): TodoItem | null {
		const todos = this.getTodos(document);
		return todos.find((todo) => todo.range.contains(position)) || null;
	}

	getTodoCount(document: vscode.TextDocument): number {
		return this.getTodos(document).length;
	}

	async linkTodoToIssue(
		document: vscode.TextDocument,
		todoItem: TodoItem,
		issueId: string,
	): Promise<void> {
		const edit = new vscode.WorkspaceEdit();
		const line = document.lineAt(todoItem.line);
		const lineText = line.text;

		// Check if the TODO already has a Linear issue ID
		if (todoItem.linearIssueId) {
			return; // Already linked
		}

		// Find the TODO pattern in the line and prepend the issue ID
		const todoPatterns = vscode.workspace
			.getConfiguration("linearTodos")
			.get<string[]>("todoPatterns", ["TODO", "FIXME", "HACK", "XXX", "BUG"]);

		let newLineText = lineText;
		for (const pattern of todoPatterns) {
			const regex = new RegExp(`(\\b${pattern}\\b):?\\s*`, "i");
			const match = lineText.match(regex);

			if (match) {
				// Prepend the issue ID: TODO: becomes [LIN-123] TODO:
				newLineText = lineText.replace(regex, `[${issueId}] $1: `);
				break;
			}
		}

		// Replace the entire line
		const fullLineRange = new vscode.Range(
			new vscode.Position(todoItem.line, 0),
			new vscode.Position(todoItem.line, lineText.length),
		);

		edit.replace(document.uri, fullLineRange, newLineText);
		await vscode.workspace.applyEdit(edit);

		// Update the cached todo item
		todoItem.linearIssueId = issueId;
		todoItem.text = newLineText.trim();

		// Update the range to reflect the new text
		todoItem.range = new vscode.Range(
			new vscode.Position(todoItem.line, 0),
			new vscode.Position(todoItem.line, newLineText.length),
		);
	}

	private determinePriority(
		pattern: string,
		text: string,
	): "low" | "medium" | "high" {
		const upperPattern = pattern.toUpperCase();
		const upperText = text.toUpperCase();

		// High priority indicators
		if (
			upperPattern === "BUG" ||
			upperPattern === "FIXME" ||
			upperText.includes("URGENT") ||
			upperText.includes("CRITICAL") ||
			upperText.includes("ASAP") ||
			text.includes("!!!")
		) {
			return "high";
		}

		// Low priority indicators
		if (
			upperPattern === "XXX" ||
			upperText.includes("MINOR") ||
			upperText.includes("NICE TO HAVE") ||
			upperText.includes("OPTIONAL")
		) {
			return "low";
		}

		// Default to medium priority
		return "medium";
	}

	private getCodeContext(
		document: vscode.TextDocument,
		lineNumber: number,
	): string {
		const startLine = Math.max(0, lineNumber - 2);
		const endLine = Math.min(document.lineCount - 1, lineNumber + 2);

		const contextLines: string[] = [];
		for (let i = startLine; i <= endLine; i++) {
			const line = document.lineAt(i);
			const prefix = i === lineNumber ? ">>> " : "    ";
			contextLines.push(`${prefix}${line.text}`);
		}

		return contextLines.join("\n");
	}

	private extractLinearIssueId(text: string): string | undefined {
		// Look for Linear issue ID pattern [LIN-123] or similar
		const match = text.match(/\[([A-Z]+-\d+)\]/);
		return match ? match[1] : undefined;
	}
}
