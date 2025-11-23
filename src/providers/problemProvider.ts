import * as vscode from 'vscode';
import { ProblemDetails } from '../services/leetcodeService';

export class ProblemProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'localjudge.problemView';
    private _view?: vscode.WebviewView;

    private _currentProblem?: ProblemDetails;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'codeNow': {
                    if (this._currentProblem) {
                        vscode.commands.executeCommand('localjudge.codeNow', this._currentProblem);
                    }
                    break;
                }
            }
        });
    }

    public showProblem(problem: ProblemDetails) {
        this._currentProblem = problem;
        if (this._view) {
            this._view.show?.(true); // Show the view
            this._view.webview.html = this._getHtmlForWebview(this._view.webview, problem);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, problem?: ProblemDetails) {
        if (!problem) {
            return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>LocalJudge</title>
                <style>
                    body { font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); padding: 10px; }
                </style>
            </head>
            <body>
                <h2>Welcome to LocalJudge</h2>
                <p>Select a problem to view details here.</p>
            </body>
            </html>`;
        }

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${problem.title}</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    color: var(--vscode-editor-foreground); 
                    background-color: var(--vscode-editor-background);
                    padding: 20px; 
                    line-height: 1.6;
                    padding-bottom: 80px; /* Space for floating button */
                }
                h1 { font-size: 1.5em; margin-bottom: 0.5em; color: var(--vscode-textLink-activeForeground); }
                .meta { margin-bottom: 15px; font-size: 0.9em; color: var(--vscode-descriptionForeground); }
                .difficulty { font-weight: bold; }
                .difficulty.Easy { color: #00B8A3; }
                .difficulty.Medium { color: #FFC01E; }
                .difficulty.Hard { color: #FF375F; }
                pre { 
                    background-color: var(--vscode-textBlockQuote-background); 
                    padding: 10px; 
                    border-radius: 5px; 
                    overflow-x: auto; 
                    border: 1px solid var(--vscode-textBlockQuote-border);
                }
                code { font-family: var(--vscode-editor-font-family); }
                .tags { margin-top: 20px; font-size: 0.9em; }
                .tag { 
                    background-color: var(--vscode-badge-background); 
                    color: var(--vscode-badge-foreground); 
                    padding: 2px 8px; 
                    border-radius: 10px; 
                    margin-right: 5px; 
                    display: inline-block;
                }
                .fab {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    font-size: 0.9em;
                    font-weight: bold;
                    border: none;
                    z-index: 1000;
                }
                .fab:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <h1>${problem.questionFrontendId}. ${problem.title}</h1>
            <div class="meta">
                <span class="difficulty ${problem.difficulty}">${problem.difficulty}</span> | 
                <span>${problem.categoryTitle}</span>
            </div>
            <div class="content">
                ${problem.content}
            </div>
            ${problem.topicTags && problem.topicTags.length > 0 ? `
            <div class="tags">
                <strong>Tags:</strong> 
                ${problem.topicTags.map(tag => `<span class="tag">${tag.name}</span>`).join('')}
            </div>` : ''}

            <button class="fab" onclick="codeNow()">Code Now</button>

            <script>
                const vscode = acquireVsCodeApi();
                function codeNow() {
                    vscode.postMessage({
                        type: 'codeNow'
                    });
                }
            </script>
        </body>
        </html>`;
    }
}
