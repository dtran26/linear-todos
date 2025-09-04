import { LinearClient } from "@linear/sdk";
import * as vscode from "vscode";
import type { LinearIssue, LinearTeam, TodoItem } from "./types";

export class LinearService {
	private client: LinearClient | null = null;
	private session: vscode.AuthenticationSession | null = null;

	async ensureAuthenticated(): Promise<boolean> {
		try {
			console.log("Attempting to authenticate with Linear...");

			// Get or create a Linear session using the Linear Connect extension
			this.session = await vscode.authentication.getSession(
				"linear", // Linear VS Code authentication provider ID
				["read", "write"], // OAuth scopes we're requesting
				{ createIfNone: true },
			);

			if (this.session) {
				this.client = new LinearClient({
					accessToken: this.session.accessToken,
				});
				console.log("✅ Acquired a Linear API session", {
					account: this.session.account,
					scopes: this.session.scopes,
				});

				// Test the connection by fetching viewer info
				const viewer = await this.client.viewer;
				console.log("✅ Linear API connection verified", {
					user: viewer.name,
					email: viewer.email,
				});

				return true;
			} else {
				console.error(
					"❌ Something went wrong, could not acquire a Linear API session.",
				);
				vscode.window.showErrorMessage(
					"Could not authenticate with Linear. Please try again.",
				);
				return false;
			}
		} catch (error) {
			console.error("❌ Failed to authenticate with Linear:", error);
			vscode.window.showErrorMessage(
				"Failed to authenticate with Linear. Please make sure the Linear Connect extension is installed and try again.",
			);
			return false;
		}
	}

	updateConfiguration(): void {
		// Configuration is now handled by Linear Connect extension
		// We only need to re-authenticate if needed
	}

	isConfigured(): boolean {
		return this.client !== null && this.session !== null;
	}

	async createIssue(todoItem: TodoItem): Promise<LinearIssue | null> {
		// Ensure we're authenticated first
		if (!(await this.ensureAuthenticated())) {
			throw new Error("Failed to authenticate with Linear");
		}

		if (!this.client) {
			throw new Error("Linear client not configured");
		}

		const config = vscode.workspace.getConfiguration("linearTodos");
		let defaultTeamId = config.get<string>("teamId");

		// If no team ID is configured, try to get the first available team
		if (!defaultTeamId) {
			const teams = await this.getTeams();
			if (teams.length > 0) {
				defaultTeamId = teams[0].id;
				vscode.window.showInformationMessage(
					`Using team: ${teams[0].name} (${teams[0].key})`,
				);
			} else {
				throw new Error(
					"No team ID configured and no teams available. Please configure a team ID in settings.",
				);
			}
		}

		try {
			const title = this.generateIssueTitle(todoItem);
			const description = this.generateIssueDescription(todoItem);

			const createIssueInput = {
				title,
				description,
				teamId: defaultTeamId,
				priority: this.mapPriorityToLinear(todoItem.priority),
			};

			console.log("📝 Creating Linear issue with input:", createIssueInput);

			const issuePayload = await this.client.createIssue(createIssueInput);
			console.log("📦 Issue payload received:", issuePayload);

			const issue = await issuePayload.issue;
			console.log("📋 Issue object:", issue);

			if (!issue) {
				throw new Error("Failed to create issue");
			}

			const state = await issue.state;
			const assignee = issue.assignee ? await issue.assignee : null;
			const labels = await issue.labels();
			const team = await issue.team;

			// Use the human-readable identifier (team key + issue number)
			const issueIdentifier = team ? `${team.key}-${issue.number}` : issue.id;

			console.log("Created Linear issue:", {
				id: issue.id,
				identifier: issueIdentifier,
				title: issue.title,
				url: issue.url,
			});

			return {
				id: issueIdentifier, // Use human-readable identifier instead of UUID
				title: issue.title,
				description: issue.description || undefined,
				url: issue.url,
				state: {
					name: state?.name || "Unknown",
					type: state?.type || "Unknown",
				},
				assignee: assignee
					? {
							name: assignee.name,
							email: assignee.email,
						}
					: undefined,
				priority: issue.priority,
				labels:
					labels?.nodes?.map((label: any) => ({
						name: label.name,
						color: label.color,
					})) || [],
				createdAt: new Date(issue.createdAt),
				updatedAt: new Date(issue.updatedAt),
			};
		} catch (error) {
			console.error("Failed to create Linear issue:", error);
			vscode.window.showErrorMessage(`Failed to create Linear issue: ${error}`);
			throw error;
		}
	}

	async getIssue(issueId: string): Promise<LinearIssue | null> {
		// Ensure we're authenticated first
		if (!(await this.ensureAuthenticated())) {
			return null;
		}

		if (!this.client) {
			throw new Error("Linear client not configured");
		}

		try {
			const issue = await this.client.issue(issueId);

			if (!issue) {
				return null;
			}

			const state = await issue.state;
			const assignee = issue.assignee ? await issue.assignee : null;
			const labels = await issue.labels();

			return {
				id: issue.id,
				title: issue.title,
				description: issue.description || undefined,
				url: issue.url,
				state: {
					name: state?.name || "Unknown",
					type: state?.type || "Unknown",
				},
				assignee: assignee
					? {
							name: assignee.name,
							email: assignee.email,
						}
					: undefined,
				priority: issue.priority,
				labels:
					labels?.nodes?.map((label: any) => ({
						name: label.name,
						color: label.color,
					})) || [],
				createdAt: new Date(issue.createdAt),
				updatedAt: new Date(issue.updatedAt),
			};
		} catch (error) {
			console.error("Failed to fetch Linear issue:", error);
			return null;
		}
	}

	async getIssueUrl(issueId: string): Promise<string | null> {
		const issue = await this.getIssue(issueId);
		return issue?.url || null;
	}

	async getTeams(): Promise<LinearTeam[]> {
		// Ensure we're authenticated first
		if (!(await this.ensureAuthenticated())) {
			return [];
		}

		if (!this.client) {
			throw new Error("Linear client not configured");
		}

		try {
			const teams = await this.client.teams();
			return teams.nodes.map((team) => ({
				id: team.id,
				name: team.name,
				key: team.key,
			}));
		} catch (error) {
			console.error("Failed to fetch Linear teams:", error);
			return [];
		}
	}

	private generateIssueTitle(todoItem: TodoItem): string {
		const fileName = todoItem.file;
		const cleanText = todoItem.text
			.replace(/^(TODO|FIXME|HACK|XXX|BUG):\s*/i, "")
			.trim();

		if (cleanText) {
			return `${cleanText} (${fileName}:${todoItem.line + 1})`;
		} else {
			return `${todoItem.pattern} in ${fileName}:${todoItem.line + 1}`;
		}
	}

	private generateIssueDescription(todoItem: TodoItem): string {
		const fileName = todoItem.file;
		const fileExtension = fileName.split(".").pop() || "text";

		const description = [
			`**File:** \`${fileName}\``,
			`**Line:** ${todoItem.line + 1}`,
			`**Type:** ${todoItem.pattern}`,
			`**Priority:** ${todoItem.priority.toUpperCase()}`,
			"",
			"**TODO Comment:**",
			"```",
			todoItem.text,
			"```",
			"",
			"**Code Context:**",
			`\`\`\`${fileExtension}`,
			todoItem.context,
			"```",
			"",
			`---`,
			`*Created from VSCode at ${new Date().toLocaleString()}*`,
			`*Direct link: [${fileName}:${todoItem.line + 1}](vscode://file/${vscode.workspace.workspaceFolders?.[0]?.uri.fsPath}/${fileName}:${todoItem.line + 1})*`,
		];

		return description.join("\n");
	}

	private mapPriorityToLinear(priority: "low" | "medium" | "high"): number {
		switch (priority) {
			case "high":
				return 1;
			case "medium":
				return 3;
			case "low":
				return 4;
			default:
				return 3;
		}
	}
}
