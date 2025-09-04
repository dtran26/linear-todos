import type * as vscode from "vscode";

export interface TodoItem {
	text: string;
	pattern: string;
	range: vscode.Range;
	line: number;
	file: string;
	linearIssueId?: string;
	priority: "low" | "medium" | "high";
	context: string; // Surrounding code context
}

export interface LinearIssue {
	id: string;
	title: string;
	description?: string;
	url: string;
	state: {
		name: string;
		type: string;
	};
	assignee?: {
		name: string;
		email: string;
	};
	priority?: number;
	labels?: Array<{
		name: string;
		color: string;
	}>;
	createdAt: Date;
	updatedAt: Date;
}

export interface LinearTeam {
	id: string;
	name: string;
	key: string;
}

export interface CreateIssueInput {
	title: string;
	description?: string;
	teamId: string;
	priority?: number;
	labelIds?: string[];
	assigneeId?: string;
}
