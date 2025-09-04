import { LinearClient } from "@linear/sdk";
import * as vscode from "vscode";
import type { LinearIssue, LinearTeam, TodoItem } from "./types";

export class LinearService {
	private client: LinearClient | null = null;
	private session: vscode.AuthenticationSession | null = null;
	private outputChannel: vscode.OutputChannel | null = null;

	async ensureAuthenticated(): Promise<boolean> {
		try {
			this.outputChannel?.appendLine(
				"Attempting to authenticate with Linear...",
			);

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
				this.outputChannel?.appendLine(
					`✅ Acquired a Linear API session for ${this.session.account.label}`,
				);

				// Test the connection by fetching viewer info
				const viewer = await this.client.viewer;
				this.outputChannel?.appendLine(
					`✅ Linear API connection verified for ${viewer.name} (${viewer.email})`,
				);

				return true;
			} else {
				this.outputChannel?.appendLine(
					"❌ Could not acquire a Linear API session",
				);
				vscode.window.showErrorMessage(
					"Could not authenticate with Linear. Please try again.",
				);
				return false;
			}
		} catch (error) {
			this.outputChannel?.appendLine(
				`❌ Failed to authenticate with Linear: ${error}`,
			);
			vscode.window.showErrorMessage(
				"Failed to authenticate with Linear. Please make sure the Linear Connect extension is installed and try again.",
			);
			return false;
		}
	}

	setOutputChannel(outputChannel: vscode.OutputChannel): void {
		this.outputChannel = outputChannel;
	}

	isConfigured(): boolean {
		return this.client !== null && this.session !== null;
	}

	updateConfiguration(): void {
		// Reset client to force re-authentication with new configuration
		// This is called when linearTodos configuration changes
		this.outputChannel?.appendLine(
			"Configuration updated, will re-authenticate on next API call",
		);
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

		// Prompt user for impact level
		const impact = await this.promptForImpact();
		if (!impact) {
			// User cancelled
			return null;
		}

		try {
			const title = this.generateIssueTitle(todoItem);
			const description = this.generateIssueDescription(todoItem);

			const createIssueInput = {
				title,
				description,
				teamId: defaultTeamId,
				priority: this.mapImpactToLinearPriority(impact),
			};

			this.outputChannel?.appendLine(
				`📝 Creating Linear issue: ${createIssueInput.title}`,
			);

			const issuePayload = await this.client.createIssue(createIssueInput);
			this.outputChannel?.appendLine(
				"📦 Issue creation request sent to Linear",
			);

			const issue = await issuePayload.issue;
			this.outputChannel?.appendLine(
				`📋 Issue created successfully: ${issue?.id}`,
			);

			if (!issue) {
				throw new Error("Failed to create issue");
			}

			const state = await issue.state;
			const assignee = issue.assignee ? await issue.assignee : null;
			const labels = await issue.labels();
			const team = await issue.team;

			// Use the human-readable identifier (team key + issue number)
			const issueIdentifier = team ? `${team.key}-${issue.number}` : issue.id;

			this.outputChannel?.appendLine(
				`✅ Created Linear issue: ${issueIdentifier} - ${issue.title}`,
			);

			return {
				id: issueIdentifier,
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
					labels?.nodes?.map((label: { name: string; color: string }) => ({
						name: label.name,
						color: label.color,
					})) || [],
				createdAt: new Date(issue.createdAt),
				updatedAt: new Date(issue.updatedAt),
			};
		} catch (error) {
			this.outputChannel?.appendLine(
				`❌ Failed to create Linear issue: ${error}`,
			);
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
			// Try to fetch by identifier first (e.g., "DT-12")
			let issue;
			if (issueId.includes("-")) {
				// This looks like a team identifier (e.g., "DT-12")
				const issues = await this.client.issues({
					filter: {
						number: {
							eq: parseInt(issueId.split("-")[1]),
						},
						team: {
							key: {
								eq: issueId.split("-")[0],
							},
						},
					},
				});
				issue = issues.nodes[0];
			} else {
				// This looks like a UUID
				issue = await this.client.issue(issueId);
			}

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
					labels?.nodes?.map((label: { name: string; color: string }) => ({
						name: label.name,
						color: label.color,
					})) || [],
				createdAt: new Date(issue.createdAt),
				updatedAt: new Date(issue.updatedAt),
			};
		} catch (error) {
			this.outputChannel?.appendLine(
				`❌ Failed to fetch Linear issue: ${error}`,
			);
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
			this.outputChannel?.appendLine(`❌ Failed to fetch teams: ${error}`);
			return [];
		}
	}

	private generateIssueTitle(todoItem: TodoItem): string {
		const fileName = this.getShortFileName(todoItem.file);
		const cleanText = todoItem.text.replace(/.*TODO:\s*/i, "").trim();

		// Maximum title length for readability
		const maxTitleLength = 80;
		let description = cleanText || "TODO item";

		// Truncate description if too long, preserving the file context
		const fileContext = `${fileName}:${todoItem.line + 1}`;
		const availableLength = maxTitleLength - fileContext.length - 3; // 3 for " • "

		if (description.length > availableLength) {
			description = description.substring(0, availableLength - 3) + "...";
		}

		return `${description} • ${fileContext}`;
	}

	private getShortFileName(filePath: string): string {
		// Extract just the filename from the path
		const parts = filePath.split("/");
		return parts[parts.length - 1];
	}

	private async promptForImpact(): Promise<string | null> {
		const impactOptions = [
			{
				label: "🔴 High - Critical issue affecting functionality or security",
				value: "High - Critical issue affecting functionality or security",
			},
			{
				label: "🟡 Medium - Standard improvement or technical debt",
				value: "Medium - Standard improvement or technical debt",
			},
			{
				label: "🔵 Low - Minor enhancement or polish",
				value: "Low - Minor enhancement or polish",
			},
		];

		const selected = await vscode.window.showQuickPick(impactOptions, {
			placeHolder: "Select the business impact of this TODO",
			title: "Linear Issue Impact",
		});

		return selected?.value || null;
	}

	private generateIssueDescription(todoItem: TodoItem): string {
		const fileName = todoItem.file;
		const fileExtension = fileName.split(".").pop() || "text";

		const description = [
			`**Location:** \`${fileName}:${todoItem.line + 1}\``,
			"",
			`\`\`\`${fileExtension}`,
			todoItem.context,
			"```",
		];

		return description.join("\n");
	}

	private mapImpactToLinearPriority(impact: string): number {
		// Map user-selected impact to Linear priority numbers
		// Linear: 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
		if (impact.includes("High")) {
			return 2; // High priority
		}
		if (impact.includes("Low")) {
			return 4; // Low priority
		}
		// Default to Medium for "Medium" or any other case
		return 3; // Medium priority
	}
}
