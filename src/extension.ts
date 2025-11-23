// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LeetCodeService } from './services/leetcodeService';
import { ProblemProvider } from './providers/problemProvider';
import { LeetCodeTreeDataProvider } from './providers/leetCodeTreeProvider';
import { getHtmlForWebview } from './utils/webviewUtils';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "localjudge" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('localjudge.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from LocalJudge!');
	});

	const leetCodeService = new LeetCodeService();
	const problemProvider = new ProblemProvider(context.extensionUri);
	const treeDataProvider = new LeetCodeTreeDataProvider(leetCodeService);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ProblemProvider.viewType, problemProvider),
		vscode.window.registerTreeDataProvider('localjudge.problems', treeDataProvider)
	);

	const showProblemDisposable = vscode.commands.registerCommand('localjudge.showProblem', async (problem: any) => {
		// This command can be triggered from tree view or other places
		if (problem) {
			// Handle case where problem is a TreeItem (context menu) or the data object (click)
			const p = problem.problem || problem;
			
			// Try to get the slug from various properties, or fallback to generating it from the title
			let slug = p.titleSlug || p.title_slug;
			if (!slug && p.title) {
				slug = p.title.toLowerCase().trim().replace(/\s+/g, '-');
			}
			slug = slug || 'unknown';

			try {
				const details = await leetCodeService.getProblem(slug);
				
				// Create and show a new webview panel
				const panel = vscode.window.createWebviewPanel(
					'localjudgeProblem',
					`${details.title}: Preview`,
					vscode.ViewColumn.One,
					{
						enableScripts: true,
						localResourceRoots: [context.extensionUri]
					}
				);

				panel.webview.html = getHtmlForWebview(panel.webview, details);

				// Handle messages from the webview
				panel.webview.onDidReceiveMessage(
					message => {
						switch (message.type) {
							case 'codeNow':
								vscode.commands.executeCommand('localjudge.codeNow', details);
								return;
							case 'openProblem':
								vscode.commands.executeCommand('localjudge.showProblem', { titleSlug: message.slug });
								return;
						}
					},
					undefined,
					context.subscriptions
				);

			} catch (error) {
				vscode.window.showErrorMessage(`Failed to load problem '${slug}': ${error}`);
			}
		}
	});

	const openGitHubDisposable = vscode.commands.registerCommand('localjudge.openGitHub', () => {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/srimanikantaBattu'));
	});

	const refreshProblemsDisposable = vscode.commands.registerCommand('localjudge.refreshProblems', () => {
		treeDataProvider.refresh();
	});

	const dailyChallengeDisposable = vscode.commands.registerCommand('localjudge.getDailyChallenge', async () => {
		try {
			vscode.window.showInformationMessage('Fetching daily challenge...');
			const daily = await leetCodeService.getDailyChallenge();
			const question = daily.question || daily; 
			
			// Fetch full details to get content
			const slug = question.titleSlug || question.title || 'unknown';
			const details = await leetCodeService.getProblem(slug);
			problemProvider.showProblem(details);

			// Focus on the problem view
			await vscode.commands.executeCommand('localjudge.problemView.focus');

		} catch (error) {
			vscode.window.showErrorMessage(`Failed to get daily challenge: ${error}`);
		}
	});

	const searchProblemDisposable = vscode.commands.registerCommand('localjudge.searchProblem', async () => {
		const query = await vscode.window.showInputBox({
			placeHolder: 'Search for a LeetCode problem...'
		});

		if (query) {
			try {
				const problems = await leetCodeService.searchProblems(query);
				const items: vscode.QuickPickItem[] = problems.map((p: any) => ({
					label: `${p.questionFrontendId}. ${p.title}`,
					description: p.difficulty,
					detail: p.titleSlug
				}));

				const selected = await vscode.window.showQuickPick(items, {
					placeHolder: 'Select a problem to view'
				});

				if (selected && selected.detail) {
					const details = await leetCodeService.getProblem(selected.detail);
					problemProvider.showProblem(details);

					// Focus on the problem view
					await vscode.commands.executeCommand('localjudge.problemView.focus');
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to search problems: ${error}`);
			}
		}
	});

	const codeNowDisposable = vscode.commands.registerCommand('localjudge.codeNow', async (problem: any) => {
		if (!problem) {
			vscode.window.showErrorMessage('No problem selected.');
			return;
		}

		const languages = ['Python', 'JavaScript', 'Java', 'C++', 'Go'];
		const selectedLanguage = await vscode.window.showQuickPick(languages, {
			placeHolder: 'Select a language to solve the problem'
		});

		if (selectedLanguage) {
			let extension = '';
			let content = '';
			const slug = problem.titleSlug || problem.title || 'unknown';
			const safeSlug = slug.replace(/-/g, '_');

			switch (selectedLanguage) {
				case 'Python':
					extension = 'py';
					content = `# ${problem.questionFrontendId}. ${problem.title}\n# ${problem.url || ''}\n\nclass Solution:\n    def ${safeSlug}(self):\n        pass`;
					break;
				case 'JavaScript':
					extension = 'js';
					content = `// ${problem.questionFrontendId}. ${problem.title}\n// ${problem.url || ''}\n\n/**\n * @param {any} args\n * @return {any}\n */\nvar ${safeSlug} = function(args) {\n    \n};`;
					break;
				case 'Java':
					extension = 'java';
					content = `// ${problem.questionFrontendId}. ${problem.title}\n// ${problem.url || ''}\n\nclass Solution {\n    public void ${safeSlug}() {\n        \n    }\n}`;
					break;
				case 'C++':
					extension = 'cpp';
					content = `// ${problem.questionFrontendId}. ${problem.title}\n// ${problem.url || ''}\n\nclass Solution {\npublic:\n    void ${safeSlug}() {\n        \n    }\n};`;
					break;
				case 'Go':
					extension = 'go';
					content = `// ${problem.questionFrontendId}. ${problem.title}\n// ${problem.url || ''}\n\npackage main\n\nfunc ${safeSlug}() {\n    \n}`;
					break;
			}

			const fileName = `${safeSlug}.${extension}`;
			let uri: vscode.Uri;
			
			if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
				const root = vscode.workspace.workspaceFolders[0].uri;
				uri = vscode.Uri.joinPath(root, fileName).with({ scheme: 'untitled' });
			} else {
				uri = vscode.Uri.parse(`untitled:${fileName}`);
			}

			const document = await vscode.workspace.openTextDocument(uri);
			const edit = new vscode.WorkspaceEdit();
			edit.insert(uri, new vscode.Position(0, 0), content);
			await vscode.workspace.applyEdit(edit);
			
			await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(dailyChallengeDisposable);
	context.subscriptions.push(searchProblemDisposable);
	context.subscriptions.push(codeNowDisposable);
	context.subscriptions.push(showProblemDisposable);
	context.subscriptions.push(openGitHubDisposable);
	context.subscriptions.push(refreshProblemsDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
