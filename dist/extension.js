"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));

// src/services/leetcodeService.ts
var LeetCodeService = class {
  baseUrl = "https://leetcode-api-pied.vercel.app";
  async getDailyChallenge() {
    try {
      const response = await fetch(`${this.baseUrl}/daily`);
      if (!response.ok) {
        throw new Error(`Failed to fetch daily challenge: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching daily challenge:", error);
      throw error;
    }
  }
  async searchProblems(query) {
    try {
      const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Failed to search problems: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error searching problems:", error);
      throw error;
    }
  }
  async getProblems(limit = 50, skip = 0) {
    try {
      const response = await fetch(`${this.baseUrl}/problems?limit=${limit}&skip=${skip}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch problems: ${response.statusText}`);
      }
      const data = await response.json();
      return data.questions || data.stat_status_pairs || data;
    } catch (error) {
      console.error("Error fetching problems:", error);
      throw error;
    }
  }
  async getProblem(slug) {
    try {
      const response = await fetch(`${this.baseUrl}/problem/${slug}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch problem details: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.titleSlug && data.url) {
        const parts = data.url.split("/");
        data.titleSlug = parts[parts.length - 2];
      } else if (!data.titleSlug) {
        data.titleSlug = slug;
      }
      return data;
    } catch (error) {
      console.error("Error fetching problem:", error);
      throw error;
    }
  }
};

// src/providers/problemProvider.ts
var vscode = __toESM(require("vscode"));
var ProblemProvider = class {
  constructor(_extensionUri) {
    this._extensionUri = _extensionUri;
  }
  static viewType = "localjudge.problemView";
  _view;
  _currentProblem;
  resolveWebviewView(webviewView, context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "codeNow": {
          if (this._currentProblem) {
            vscode.commands.executeCommand("localjudge.codeNow", this._currentProblem);
          }
          break;
        }
      }
    });
  }
  showProblem(problem) {
    this._currentProblem = problem;
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.html = this._getHtmlForWebview(this._view.webview, problem);
    }
  }
  _getHtmlForWebview(webview, problem) {
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
                ${problem.topicTags.map((tag) => `<span class="tag">${tag.name}</span>`).join("")}
            </div>` : ""}

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
};

// src/providers/leetCodeTreeProvider.ts
var vscode2 = __toESM(require("vscode"));
var LeetCodeTreeDataProvider = class {
  constructor(leetCodeService) {
    this.leetCodeService = leetCodeService;
    this.refresh();
  }
  _onDidChangeTreeData = new vscode2.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  allProblems = [];
  refresh() {
    this.leetCodeService.getProblems(1e3, 0).then((problems) => {
      this.allProblems = problems;
      this._onDidChangeTreeData.fire();
    }).catch((err) => {
      vscode2.window.showErrorMessage(`Failed to load problems: ${err}`);
    });
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      return Promise.resolve([
        new LeetCodeTreeItem("All", vscode2.TreeItemCollapsibleState.Collapsed, "all"),
        new LeetCodeTreeItem("Difficulty", vscode2.TreeItemCollapsibleState.Collapsed, "difficulty"),
        new LeetCodeTreeItem("Tag", vscode2.TreeItemCollapsibleState.Collapsed, "tag")
      ]);
    }
    if (element.contextValue === "all") {
      return Promise.resolve(this.allProblems.map((p) => {
        const id = p.questionFrontendId || p.questionId || "";
        const label = id ? `${id}. ${p.title}` : p.title;
        return new LeetCodeTreeItem(label, vscode2.TreeItemCollapsibleState.None, "problem", p);
      }));
    }
    if (element.contextValue === "difficulty") {
      return Promise.resolve([
        new LeetCodeTreeItem("Easy", vscode2.TreeItemCollapsibleState.Collapsed, "difficulty_group"),
        new LeetCodeTreeItem("Medium", vscode2.TreeItemCollapsibleState.Collapsed, "difficulty_group"),
        new LeetCodeTreeItem("Hard", vscode2.TreeItemCollapsibleState.Collapsed, "difficulty_group")
      ]);
    }
    if (element.contextValue === "difficulty_group") {
      const difficulty = element.label;
      const filtered = this.allProblems.filter((p) => p.difficulty === difficulty);
      return Promise.resolve(filtered.map((p) => {
        const id = p.questionFrontendId || p.questionId || "";
        const label = id ? `${id}. ${p.title}` : p.title;
        return new LeetCodeTreeItem(label, vscode2.TreeItemCollapsibleState.None, "problem", p);
      }));
    }
    if (element.contextValue === "tag") {
      const commonTags = ["Array", "String", "Hash Table", "Dynamic Programming", "Math", "Sorting", "Greedy", "Depth-First Search", "Binary Search", "Tree"];
      return Promise.resolve(commonTags.map(
        (tag) => new LeetCodeTreeItem(tag, vscode2.TreeItemCollapsibleState.Collapsed, "tag_group")
      ));
    }
    if (element.contextValue === "tag_group") {
      return Promise.resolve([new LeetCodeTreeItem("Loading tags not supported in this view yet", vscode2.TreeItemCollapsibleState.None, "info")]);
    }
    return Promise.resolve([]);
  }
};
var LeetCodeTreeItem = class extends vscode2.TreeItem {
  constructor(label, collapsibleState, contextValue, problem) {
    super(label, collapsibleState);
    this.label = label;
    this.collapsibleState = collapsibleState;
    this.contextValue = contextValue;
    this.problem = problem;
    this.tooltip = this.label;
    if (contextValue === "problem" && problem) {
      this.command = {
        command: "localjudge.showProblem",
        title: "Show Problem",
        arguments: [problem]
      };
      this.iconPath = new vscode2.ThemeIcon("file-code");
    } else if (contextValue === "difficulty" || contextValue === "tag" || contextValue === "all") {
      this.iconPath = new vscode2.ThemeIcon("folder");
    } else if (contextValue === "difficulty_group" || contextValue === "tag_group") {
      this.iconPath = new vscode2.ThemeIcon("folder-opened");
    }
  }
};

// src/utils/webviewUtils.ts
function getHtmlForWebview(webview, problem) {
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
  let stats = {};
  try {
    stats = problem.stats ? JSON.parse(problem.stats) : {};
  } catch (e) {
    console.error("Failed to parse stats", e);
  }
  let similarQuestions = [];
  try {
    similarQuestions = problem.similarQuestions ? JSON.parse(problem.similarQuestions) : [];
  } catch (e) {
    console.error("Failed to parse similar questions", e);
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
            .meta { margin-bottom: 15px; font-size: 0.9em; color: var(--vscode-descriptionForeground); display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
            .difficulty { font-weight: bold; }
            .difficulty.Easy { color: #00B8A3; }
            .difficulty.Medium { color: #FFC01E; }
            .difficulty.Hard { color: #FF375F; }
            .stat-item { display: flex; align-items: center; gap: 5px; }
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
                margin-bottom: 5px;
            }
            .section { margin-top: 25px; }
            .section h3 { font-size: 1.1em; margin-bottom: 10px; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 5px; }
            .similar-link {
                display: block;
                color: var(--vscode-textLink-foreground);
                text-decoration: none;
                margin-bottom: 5px;
                cursor: pointer;
            }
            .similar-link:hover { text-decoration: underline; }
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
            <span class="difficulty ${problem.difficulty}">${problem.difficulty}</span>
            <span>|</span>
            <span>${problem.categoryTitle}</span>
            <span>|</span>
            <span class="stat-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                ${problem.likes}
            </span>
            <span class="stat-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                ${problem.dislikes}
            </span>
            ${stats.acRate ? `<span>|</span><span class="stat-item">Acceptance: ${stats.acRate}</span>` : ""}
        </div>

        <div class="content">
            ${problem.content}
        </div>

        ${problem.topicTags && problem.topicTags.length > 0 ? `
        <div class="tags">
            <strong>Tags:</strong> 
            ${problem.topicTags.map((tag) => `<span class="tag">${tag.name}</span>`).join("")}
        </div>` : ""}

        ${similarQuestions.length > 0 ? `
        <div class="section">
            <h3>Similar Questions</h3>
            ${similarQuestions.map((q) => `
                <a class="similar-link" onclick="openProblem('${q.titleSlug}')">
                    ${q.title} <span class="difficulty ${q.difficulty}" style="font-size: 0.8em;">(${q.difficulty})</span>
                </a>
            `).join("")}
        </div>` : ""}

        <button class="fab" onclick="codeNow()">Code Now</button>

        <script>
            const vscode = acquireVsCodeApi();
            function codeNow() {
                vscode.postMessage({
                    type: 'codeNow'
                });
            }
            function openProblem(slug) {
                vscode.postMessage({
                    type: 'openProblem',
                    slug: slug
                });
            }
        </script>
    </body>
    </html>`;
}

// src/extension.ts
function activate(context) {
  console.log('Congratulations, your extension "localjudge" is now active!');
  const disposable = vscode3.commands.registerCommand("localjudge.helloWorld", () => {
    vscode3.window.showInformationMessage("Hello World from LocalJudge!");
  });
  const leetCodeService = new LeetCodeService();
  const problemProvider = new ProblemProvider(context.extensionUri);
  const treeDataProvider = new LeetCodeTreeDataProvider(leetCodeService);
  context.subscriptions.push(
    vscode3.window.registerWebviewViewProvider(ProblemProvider.viewType, problemProvider),
    vscode3.window.registerTreeDataProvider("localjudge.problems", treeDataProvider)
  );
  const showProblemDisposable = vscode3.commands.registerCommand("localjudge.showProblem", async (problem) => {
    if (problem) {
      const p = problem.problem || problem;
      let slug = p.titleSlug || p.title_slug;
      if (!slug && p.title) {
        slug = p.title.toLowerCase().trim().replace(/\s+/g, "-");
      }
      slug = slug || "unknown";
      try {
        const details = await leetCodeService.getProblem(slug);
        const panel = vscode3.window.createWebviewPanel(
          "localjudgeProblem",
          `${details.title}: Preview`,
          vscode3.ViewColumn.One,
          {
            enableScripts: true,
            localResourceRoots: [context.extensionUri]
          }
        );
        panel.webview.html = getHtmlForWebview(panel.webview, details);
        panel.webview.onDidReceiveMessage(
          (message) => {
            switch (message.type) {
              case "codeNow":
                vscode3.commands.executeCommand("localjudge.codeNow", details);
                return;
              case "openProblem":
                vscode3.commands.executeCommand("localjudge.showProblem", { titleSlug: message.slug });
                return;
            }
          },
          void 0,
          context.subscriptions
        );
      } catch (error) {
        vscode3.window.showErrorMessage(`Failed to load problem '${slug}': ${error}`);
      }
    }
  });
  const openGitHubDisposable = vscode3.commands.registerCommand("localjudge.openGitHub", () => {
    vscode3.env.openExternal(vscode3.Uri.parse("https://github.com/srimanikantaBattu"));
  });
  const refreshProblemsDisposable = vscode3.commands.registerCommand("localjudge.refreshProblems", () => {
    treeDataProvider.refresh();
  });
  const dailyChallengeDisposable = vscode3.commands.registerCommand("localjudge.getDailyChallenge", async () => {
    try {
      vscode3.window.showInformationMessage("Fetching daily challenge...");
      const daily = await leetCodeService.getDailyChallenge();
      const question = daily.question || daily;
      const slug = question.titleSlug || question.title || "unknown";
      const details = await leetCodeService.getProblem(slug);
      problemProvider.showProblem(details);
      await vscode3.commands.executeCommand("localjudge.problemView.focus");
    } catch (error) {
      vscode3.window.showErrorMessage(`Failed to get daily challenge: ${error}`);
    }
  });
  const searchProblemDisposable = vscode3.commands.registerCommand("localjudge.searchProblem", async () => {
    const query = await vscode3.window.showInputBox({
      placeHolder: "Search for a LeetCode problem..."
    });
    if (query) {
      try {
        const problems = await leetCodeService.searchProblems(query);
        const items = problems.map((p) => ({
          label: `${p.questionFrontendId}. ${p.title}`,
          description: p.difficulty,
          detail: p.titleSlug
        }));
        const selected = await vscode3.window.showQuickPick(items, {
          placeHolder: "Select a problem to view"
        });
        if (selected && selected.detail) {
          const details = await leetCodeService.getProblem(selected.detail);
          problemProvider.showProblem(details);
          await vscode3.commands.executeCommand("localjudge.problemView.focus");
        }
      } catch (error) {
        vscode3.window.showErrorMessage(`Failed to search problems: ${error}`);
      }
    }
  });
  const codeNowDisposable = vscode3.commands.registerCommand("localjudge.codeNow", async (problem) => {
    if (!problem) {
      vscode3.window.showErrorMessage("No problem selected.");
      return;
    }
    const languages = ["Python", "JavaScript", "Java", "C++", "Go"];
    const selectedLanguage = await vscode3.window.showQuickPick(languages, {
      placeHolder: "Select a language to solve the problem"
    });
    if (selectedLanguage) {
      let extension = "";
      let content = "";
      const slug = problem.titleSlug || problem.title || "unknown";
      const safeSlug = slug.replace(/-/g, "_");
      switch (selectedLanguage) {
        case "Python":
          extension = "py";
          content = `# ${problem.questionFrontendId}. ${problem.title}
# ${problem.url || ""}

class Solution:
    def ${safeSlug}(self):
        pass`;
          break;
        case "JavaScript":
          extension = "js";
          content = `// ${problem.questionFrontendId}. ${problem.title}
// ${problem.url || ""}

/**
 * @param {any} args
 * @return {any}
 */
var ${safeSlug} = function(args) {
    
};`;
          break;
        case "Java":
          extension = "java";
          content = `// ${problem.questionFrontendId}. ${problem.title}
// ${problem.url || ""}

class Solution {
    public void ${safeSlug}() {
        
    }
}`;
          break;
        case "C++":
          extension = "cpp";
          content = `// ${problem.questionFrontendId}. ${problem.title}
// ${problem.url || ""}

class Solution {
public:
    void ${safeSlug}() {
        
    }
};`;
          break;
        case "Go":
          extension = "go";
          content = `// ${problem.questionFrontendId}. ${problem.title}
// ${problem.url || ""}

package main

func ${safeSlug}() {
    
}`;
          break;
      }
      const fileName = `${safeSlug}.${extension}`;
      let uri;
      if (vscode3.workspace.workspaceFolders && vscode3.workspace.workspaceFolders.length > 0) {
        const root = vscode3.workspace.workspaceFolders[0].uri;
        uri = vscode3.Uri.joinPath(root, fileName).with({ scheme: "untitled" });
      } else {
        uri = vscode3.Uri.parse(`untitled:${fileName}`);
      }
      const document = await vscode3.workspace.openTextDocument(uri);
      const edit = new vscode3.WorkspaceEdit();
      edit.insert(uri, new vscode3.Position(0, 0), content);
      await vscode3.workspace.applyEdit(edit);
      await vscode3.window.showTextDocument(document, vscode3.ViewColumn.One);
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
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
