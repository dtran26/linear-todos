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

		// Header
		markdown.appendMarkdown(`## ${todoItem.pattern} Item\n\n`);

		// Priority badge
		const priorityColor = this.getPriorityColor(todoItem.priority);
		markdown.appendMarkdown(
			`**Priority:** <span style="color: ${priorityColor}">●</span> ${todoItem.priority.toUpperCase()}\n\n`,
		);

		// TODO text
		markdown.appendMarkdown(`**Description:** ${todoItem.text}\n\n`);

		// File info
		markdown.appendMarkdown(
			`**Location:** ${todoItem.file}:${todoItem.line + 1}\n\n`,
		);

		// Linear integration status
		if (todoItem.linearIssueId) {
			markdown.appendMarkdown(`---\n\n`);
			markdown.appendMarkdown(
				`### 🔗 Linked Linear Issue: ${todoItem.linearIssueId}\n\n`,
			);

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
			markdown.appendMarkdown(`---\n\n`);
			markdown.appendMarkdown(`### 🎯 Create Linear Issue\n\n`);
			markdown.appendMarkdown(
				`[📝 Create Issue](command:linear-todos.createIssue) to track this TODO in Linear\n\n`,
			);
		}

		// Code context
		markdown.appendMarkdown(`### Code Context\n\n`);
		markdown.appendMarkdown("```typescript\n");
		markdown.appendMarkdown(todoItem.context);
		markdown.appendMarkdown("\n```\n\n");

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

	private getPriorityColor(priority: "low" | "medium" | "high"): string {
		switch (priority) {
			case "high":
				return "#dc3545";
			case "medium":
				return "#ffc107";
			case "low":
				return "#28a745";
			default:
				return "#6c757d";
		}
	}
}
