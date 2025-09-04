import * as vscode from "vscode";
import { LinearService } from "./linear_service";
import { TodoCodeActionProvider } from "./todo_code_action_provider";
import { TodoDecorationProvider } from "./todo_decoration_provider";
import { TodoHoverProvider } from "./todo_hover_provider";
import { TodoManager } from "./todo_manager";

let todoManager: TodoManager;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
	console.log("Linear TODOs extension is now active!");

	// Create output channel for debugging
	outputChannel = vscode.window.createOutputChannel("Linear TODOs");
	outputChannel.appendLine("Linear TODOs extension activated");
	context.subscriptions.push(outputChannel);

	// Initialize services
	const linearService = new LinearService();
	todoManager = new TodoManager(linearService);
	const decorationProvider = new TodoDecorationProvider(todoManager);
	const hoverProvider = new TodoHoverProvider(todoManager, linearService);
	const codeActionProvider = new TodoCodeActionProvider(todoManager);

	// Create status bar item
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		100,
	);
	statusBarItem.command = "linear-todos.refreshTodos";
	context.subscriptions.push(statusBarItem);

	// Register commands
	const createIssueCommand = vscode.commands.registerCommand(
		"linear-todos.createIssue",
		async (uri?: vscode.Uri, position?: vscode.Position) => {
			await createLinearIssueFromTodo(uri, position, linearService);
		},
	);

	const openIssueCommand = vscode.commands.registerCommand(
		"linear-todos.openIssue",
		async (issueId: string) => {
			await openLinearIssue(issueId, linearService);
		},
	);

	const refreshTodosCommand = vscode.commands.registerCommand(
		"linear-todos.refreshTodos",
		async () => {
			await refreshTodos();
		},
	);

	const configureCommand = vscode.commands.registerCommand(
		"linear-todos.configure",
		async () => {
			await configureLinearIntegration();
		},
	);

	// Register providers
	const hoverProviderDisposable = vscode.languages.registerHoverProvider(
		{ scheme: "file" },
		hoverProvider,
	);

	const codeActionProviderDisposable =
		vscode.languages.registerCodeActionsProvider(
			{ scheme: "file" },
			codeActionProvider,
			{
				providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
			},
		);

	// Register event listeners
	const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(
		() => {
			decorationProvider.updateDecorations();
			updateStatusBar();
		},
	);

	const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(
		() => {
			decorationProvider.updateDecorations();
			updateStatusBar();
		},
	);

	const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(
		(e) => {
			if (e.affectsConfiguration("linearTodos")) {
				linearService.updateConfiguration();
				decorationProvider.updateDecorations();
			}
		},
	);

	// Add to subscriptions
	context.subscriptions.push(
		createIssueCommand,
		openIssueCommand,
		refreshTodosCommand,
		configureCommand,
		hoverProviderDisposable,
		codeActionProviderDisposable,
		onDidChangeActiveTextEditor,
		onDidChangeTextDocument,
		onDidChangeConfiguration,
	);

	// Initial setup
	decorationProvider.updateDecorations();
	updateStatusBar();
}

async function createLinearIssueFromTodo(
	_uri?: vscode.Uri,
	position?: vscode.Position,
	linearService?: LinearService,
) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("No active editor found");
		return;
	}

	const document = editor.document;
	const currentPosition = position || editor.selection.active;

	// Find the TODO item at the current position
	const todoItem = todoManager.getTodoAtPosition(document, currentPosition);
	if (!todoItem) {
		vscode.window.showErrorMessage("No TODO item found at current position");
		return;
	}

	if (!linearService) {
		vscode.window.showErrorMessage("Linear service not available");
		return;
	}

	try {
		outputChannel.appendLine(
			`Creating Linear issue for TODO: ${todoItem.text}`,
		);
		outputChannel.appendLine(
			`TODO location: ${todoItem.file}:${todoItem.line + 1}`,
		);

		const issue = await linearService.createIssue(todoItem);
		if (issue) {
			outputChannel.appendLine(
				`Successfully created Linear issue: ${issue.id} - ${issue.title}`,
			);
			outputChannel.appendLine(`Issue URL: ${issue.url}`);

			// Update the TODO comment with the Linear issue ID
			await todoManager.linkTodoToIssue(document, todoItem, issue.id);
			vscode.window.showInformationMessage(
				`Created Linear issue: ${issue.id} - ${issue.title}`,
			);
		} else {
			outputChannel.appendLine("Issue creation returned null");
			vscode.window.showErrorMessage(
				"Failed to create Linear issue: No issue returned",
			);
		}
	} catch (error) {
		outputChannel.appendLine(`Error creating Linear issue: ${error}`);
		outputChannel.appendLine(
			`Error details: ${JSON.stringify(error, null, 2)}`,
		);
		vscode.window.showErrorMessage(`Failed to create Linear issue: ${error}`);
	}
}

async function openLinearIssue(issueId: string, linearService?: LinearService) {
	if (!linearService) {
		vscode.window.showErrorMessage("Linear service not available");
		return;
	}

	try {
		const issueUrl = await linearService.getIssueUrl(issueId);
		if (issueUrl) {
			vscode.env.openExternal(vscode.Uri.parse(issueUrl));
		} else {
			vscode.window.showErrorMessage("Could not get issue URL");
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to open Linear issue: ${error}`);
	}
}

async function refreshTodos() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		await todoManager.scanDocument(editor.document);
		updateStatusBar();
		vscode.window.showInformationMessage("TODOs refreshed");
	}
}

async function configureLinearIntegration() {
	const config = vscode.workspace.getConfiguration("linearTodos");

	const teamId = await vscode.window.showInputBox({
		prompt:
			"Enter your Linear team ID (optional - if not provided, first available team will be used)",
		placeHolder: "team-id",
		value: config.get<string>("teamId") || "",
	});

	if (teamId !== undefined) {
		await config.update("teamId", teamId, vscode.ConfigurationTarget.Global);
		vscode.window.showInformationMessage(
			"Linear team configuration updated! Authentication will be handled automatically via Linear Connect.",
		);
	}
}

function updateStatusBar() {
	const config = vscode.workspace.getConfiguration("linearTodos");
	if (!config.get("showStatusBar", true)) {
		statusBarItem.hide();
		return;
	}

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const todoCount = todoManager.getTodoCount(editor.document);
		statusBarItem.text = `$(checklist) ${todoCount} TODOs`;
		statusBarItem.show();
	} else {
		statusBarItem.hide();
	}
}

export function deactivate() {
	if (statusBarItem) {
		statusBarItem.dispose();
	}
}
