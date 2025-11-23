import * as vscode from 'vscode';
import { LeetCodeService, LeetCodeProblem } from '../services/leetcodeService';

export class LeetCodeTreeDataProvider implements vscode.TreeDataProvider<LeetCodeTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LeetCodeTreeItem | undefined | null | void> = new vscode.EventEmitter<LeetCodeTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<LeetCodeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private allProblems: LeetCodeProblem[] = [];

    constructor(private leetCodeService: LeetCodeService) {
        this.refresh();
    }

    refresh(): void {
        this.leetCodeService.getProblems(1000, 0).then(problems => {
            this.allProblems = problems;
            this._onDidChangeTreeData.fire();
        }).catch(err => {
            vscode.window.showErrorMessage(`Failed to load problems: ${err}`);
        });
    }

    getTreeItem(element: LeetCodeTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: LeetCodeTreeItem): Thenable<LeetCodeTreeItem[]> {
        if (!element) {
            return Promise.resolve([
                new LeetCodeTreeItem('All', vscode.TreeItemCollapsibleState.Collapsed, 'all'),
                new LeetCodeTreeItem('Difficulty', vscode.TreeItemCollapsibleState.Collapsed, 'difficulty'),
                new LeetCodeTreeItem('Tag', vscode.TreeItemCollapsibleState.Collapsed, 'tag')
            ]);
        }

        if (element.contextValue === 'all') {
            return Promise.resolve(this.allProblems.map(p => {
                const id = p.questionFrontendId || p.questionId || '';
                const label = id ? `${id}. ${p.title}` : p.title;
                return new LeetCodeTreeItem(label, vscode.TreeItemCollapsibleState.None, 'problem', p);
            }));
        }

        if (element.contextValue === 'difficulty') {
            return Promise.resolve([
                new LeetCodeTreeItem('Easy', vscode.TreeItemCollapsibleState.Collapsed, 'difficulty_group'),
                new LeetCodeTreeItem('Medium', vscode.TreeItemCollapsibleState.Collapsed, 'difficulty_group'),
                new LeetCodeTreeItem('Hard', vscode.TreeItemCollapsibleState.Collapsed, 'difficulty_group')
            ]);
        }

        if (element.contextValue === 'difficulty_group') {
            const difficulty = element.label as string;
            const filtered = this.allProblems.filter(p => p.difficulty === difficulty);
            return Promise.resolve(filtered.map(p => {
                const id = p.questionFrontendId || p.questionId || '';
                const label = id ? `${id}. ${p.title}` : p.title;
                return new LeetCodeTreeItem(label, vscode.TreeItemCollapsibleState.None, 'problem', p);
            }));
        }

        if (element.contextValue === 'tag') {
            // Extract unique tags from problems if available, or use a predefined list.
            // Since the basic list might not have tags, we might need to fetch them or use a static list.
            // For now, let's use a static list of common tags as a placeholder or extract if possible.
            // Assuming we don't have tags in the basic list, we'll show a placeholder or common ones.
            const commonTags = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Depth-First Search', 'Binary Search', 'Tree'];
            return Promise.resolve(commonTags.map(tag => 
                new LeetCodeTreeItem(tag, vscode.TreeItemCollapsibleState.Collapsed, 'tag_group')
            ));
        }

        if (element.contextValue === 'tag_group') {
            // Filtering by tag might require fetching details or if the list has tags.
            // If the basic list doesn't have tags, this feature is limited.
            // Let's assume for now we can't filter by tag client-side easily without more data.
            // We will show a message or try to filter if data allows.
            return Promise.resolve([new LeetCodeTreeItem('Loading tags not supported in this view yet', vscode.TreeItemCollapsibleState.None, 'info')]);
        }

        return Promise.resolve([]);
    }
}

export class LeetCodeTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly problem?: LeetCodeProblem
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        if (contextValue === 'problem' && problem) {
            this.command = {
                command: 'localjudge.showProblem',
                title: 'Show Problem',
                arguments: [problem]
            };
            this.iconPath = new vscode.ThemeIcon('file-code');
        } else if (contextValue === 'difficulty' || contextValue === 'tag' || contextValue === 'all') {
            this.iconPath = new vscode.ThemeIcon('folder');
        } else if (contextValue === 'difficulty_group' || contextValue === 'tag_group') {
            this.iconPath = new vscode.ThemeIcon('folder-opened');
        }
    }
}
