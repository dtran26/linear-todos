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
		const todoItem = this.todoManager.getTodoAtPosition(document, position);

		if (!todoItem) {
			return null;
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
					}
				} catch {
					markdown.appendMarkdown(`*Failed to fetch issue details*\n\n`);
				}
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
				`[➕ Create Linear Issue](command:linear-todos.createIssue)\n\n`,
			);
		}

		return new vscode.Hover(markdown, todoItem.range);
	}

	private formatLinearIssueDetails(issue: LinearIssue): string {
		const details: string[] = [];

		details.push(`**Title:** ${issue.title}\n`);
		details.push(`**Status:** ${issue.state.name}\n`);

		if (issue.assignee) {
			details.push(`**Assignee:** ${issue.assignee.name}\n`);
		}

		if (issue.priority) {
			const priorityText = this.mapLinearPriorityToText(issue.priority);
			details.push(`**Priority:** ${priorityText}\n`);
		}

		if (issue.labels && issue.labels.length > 0) {
			const labelText = issue.labels
				.map((label) => `\`${label.name}\``)
				.join(", ");
			details.push(`**Labels:** ${labelText}\n`);
		}

		if (issue.description) {
			details.push(`\n**Description:**\n${issue.description}\n`);
		}

		details.push(`\n*Last updated: ${issue.updatedAt.toLocaleDateString()}*\n`);

		// Add backlink to the Linear issue
		details.push(`\n[🔗 View in Linear](${issue.url})\n\n`);

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
