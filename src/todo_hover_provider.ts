import * as vscode from "vscode";
import type { LinearService } from "./linear_service";
import type { TodoManager } from "./todo_manager";
import type { LinearIssue } from "./types";

export class TodoHoverProvider implements vscode.HoverProvider {
	constructor(
		private todoManager: TodoManager,
		private linearService: LinearService,
	) {}

	async provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): Promise<vscode.Hover | null> {
		// First try to get TODO at exact position
		let todoItem = this.todoManager.getTodoAtPosition(document, position);

		// If not found at exact position, check if there's a TODO on this line
		if (!todoItem) {
			todoItem = this.todoManager.getTodoOnLine(document, position.line);
		}

		// If still no TODO found, check if the line contains a TODO pattern
		if (!todoItem) {
			const line = document.lineAt(position.line);
			const regex = /\bTODO\b/i;
			if (!regex.test(line.text)) {
				return null;
			}
			// If we reach here, there's a TODO pattern but it's not in our cache
			// This could happen if the document hasn't been scanned yet
			await this.todoManager.scanDocument(document);
			todoItem = this.todoManager.getTodoOnLine(document, position.line);
			if (!todoItem) {
				return null;
			}
		}

		const markdown = new vscode.MarkdownString();
		markdown.isTrusted = true;

		if (todoItem.linearIssueId) {
			// Rich hover for linked Linear issues
			markdown.appendMarkdown(`## 🔗 TODO → ${todoItem.linearIssueId}\n\n`);

			// Try to fetch issue details
			if (this.linearService.isConfigured()) {
				try {
					const issue = await this.linearService.getIssue(
						todoItem.linearIssueId,
					);
					if (issue) {
						markdown.appendMarkdown(this.formatLinearIssueDetails(issue));
					} else {
						markdown.appendMarkdown(
							`*Issue ${todoItem.linearIssueId} not found*\n\n`,
						);
					}
				} catch (error) {
					markdown.appendMarkdown(
						`*Failed to fetch issue details: ${error}*\n\n`,
					);
				}
			} else {
				markdown.appendMarkdown(`*Linear service not configured*\n\n`);
			}

			markdown.appendMarkdown(
				`[🔗 Open in Linear](command:linear-todos.openIssue?${encodeURIComponent(JSON.stringify([todoItem.linearIssueId]))})\n\n`,
			);
		} else {
			// Concise hover for unlinked TODOs
			const cleanText = todoItem.text.replace(/.*TODO:\s*/i, "").trim();

			markdown.appendMarkdown(
				`📝 **TODO:** ${cleanText || "Item requiring attention"}\n\n`,
			);
			markdown.appendMarkdown(
				`📍 \`${todoItem.file}:${todoItem.line + 1}\`\n\n`,
			);
			markdown.appendMarkdown(
				`[➕ Create Linear Issue](command:linear-todos.createIssueFromLine?${encodeURIComponent(JSON.stringify([document.uri.toString(), todoItem.line]))})\n\n`,
			);
		}

		return new vscode.Hover(markdown, todoItem.range);
	}

	private formatLinearIssueDetails(issue: LinearIssue): string {
		const details: string[] = [];

		details.push(`**${issue.title}**\n\n`);
		details.push(`**Status:** ${issue.state.name}`);

		if (issue.assignee) {
			details.push(` • **Assignee:** ${issue.assignee.name}`);
		}

		if (issue.priority) {
			const priorityText = this.mapLinearPriorityToText(issue.priority);
			details.push(` • **Priority:** ${priorityText}`);
		}

		if (issue.labels && issue.labels.length > 0) {
			const labelText = issue.labels
				.map((label) => `\`${label.name}\``)
				.join(", ");
			details.push(` • **Labels:** ${labelText}`);
		}

		details.push(
			`\n\n*Last updated: ${issue.updatedAt.toLocaleDateString()}*\n\n`,
		);

		return details.join("");
	}

	private mapLinearPriorityToText(priority: number): string {
		switch (priority) {
			case 1:
				return "🔴 Urgent";
			case 2:
				return "🟠 High";
			case 3:
				return "🟡 Medium";
			case 4:
				return "🔵 Low";
			default:
				return "⚪ No Priority";
		}
	}
}
