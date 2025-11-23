import * as vscode from 'vscode';

export interface LeetCodeProblem {
    questionId: string;
    questionFrontendId: string;
    title: string;
    titleSlug?: string; 
    title_slug?: string; // API might return this
    // In the user provided schema, titleSlug is NOT present in the root.
    // However, it IS present in 'similarQuestions'.
    // Wait, the user provided schema for "Two Sum" does NOT have 'titleSlug' at the top level!
    // It has 'url': "https://leetcode.com/problems/two-sum/"
    // We can extract slug from URL if needed, or rely on the search result which had it.
    isPaidOnly: boolean;
    difficulty: string;
    likes: number;
    dislikes: number;
    categoryTitle: string;
}

export interface DailyChallenge {
    date: string;
    link: string;
    question: LeetCodeProblem;
}

export interface ProblemDetails extends LeetCodeProblem {
    content: string; // HTML content
    exampleTestcases?: string; // This might be missing in the new schema
    hints: string[];
    link?: string;
    url?: string;
    topicTags?: { name: string }[];
    stats?: string;
    similarQuestions?: string; // JSON string
}

export class LeetCodeService {
    private baseUrl = 'https://leetcode-api-pied.vercel.app';

    async getDailyChallenge(): Promise<DailyChallenge> {
        try {
            const response = await fetch(`${this.baseUrl}/daily`);
            if (!response.ok) {
                throw new Error(`Failed to fetch daily challenge: ${response.statusText}`);
            }
            const data = await response.json() as any;
            return data;
        } catch (error) {
            console.error('Error fetching daily challenge:', error);
            throw error;
        }
    }

    async searchProblems(query: string): Promise<LeetCodeProblem[]> {
        try {
            const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`Failed to search problems: ${response.statusText}`);
            }
            const data = await response.json() as any;
            return data;
        } catch (error) {
            console.error('Error searching problems:', error);
            throw error;
        }
    }

    async getProblems(limit: number = 50, skip: number = 0): Promise<LeetCodeProblem[]> {
        try {
            // The API /problems endpoint returns all problems or a list. 
            // Based on docs: /problems
            const response = await fetch(`${this.baseUrl}/problems?limit=${limit}&skip=${skip}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch problems: ${response.statusText}`);
            }
            const data = await response.json() as any;
            // Assuming data.problemsetQuestionList or similar array
            // If the API returns a direct array or wrapped object, we need to handle it.
            // Let's assume it returns { questions: [...] } or [...]
            // Adjusting based on common API patterns if exact schema isn't known, 
            // but for now let's assume it returns the list directly or in a standard property.
            return data.questions || data.stat_status_pairs || data; 
        } catch (error) {
            console.error('Error fetching problems:', error);
            throw error;
        }
    }

    async getProblem(slug: string): Promise<ProblemDetails> {
        try {
            const response = await fetch(`${this.baseUrl}/problem/${slug}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch problem details: ${response.statusText}`);
            }
            const data = await response.json() as any;
            // The API response for details doesn't seem to have titleSlug at the root based on user input.
            // We should inject it back if we know it, or extract from URL.
            if (!data.titleSlug && data.url) {
                const parts = data.url.split('/');
                // url: https://leetcode.com/problems/two-sum/
                // parts: ["https:", "", "leetcode.com", "problems", "two-sum", ""]
                data.titleSlug = parts[parts.length - 2];
            } else if (!data.titleSlug) {
                 data.titleSlug = slug; // Fallback to the requested slug
            }
            return data;
        } catch (error) {
            console.error('Error fetching problem:', error);
            throw error;
        }
    }
}
