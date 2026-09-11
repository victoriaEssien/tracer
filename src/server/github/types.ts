/**
 * The slices of GitHub's API responses we actually read.
 *
 * Hand-written rather than generated: the collector uses a handful of fields
 * from a handful of endpoints, and a full schema would hide which ones.
 */

export interface RestRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; type: string };
  description: string | null;
  html_url: string;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: { spdx_id: string | null; name: string } | null;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  created_at: string;
  pushed_at: string;
  updated_at: string;
  default_branch: string;
  size: number;
}

export interface RestCommit {
  sha: string;
  commit: { author: { name: string; date: string } | null };
  author: { login: string } | null;
}

export interface RestRelease {
  tag_name: string;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
}

export interface RestContributor {
  login: string;
  contributions: number;
  type: string;
}

export interface RestSearchIssueItem {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: "open" | "closed";
  user: { login: string } | null;
  author_association: string;
  labels: { name: string; description: string | null; color: string | null }[];
  assignees: { login: string }[];
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  /** Present on search results; `repository_url` has to be parsed for the rest. */
  repository_url: string;
  pull_request?: unknown;
}

export interface RestSearchResponse<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface RestContentItem {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
  size: number;
}

/* -------------------------------------------------------------------------- */
/* GraphQL                                                                    */
/* -------------------------------------------------------------------------- */

export interface GraphQlActor {
  login: string;
}

export interface GraphQlPullRequestNode {
  number: number;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  state: "OPEN" | "CLOSED" | "MERGED";
  author: GraphQlActor | null;
  authorAssociation: string;
  comments: { nodes: { createdAt: string; author: GraphQlActor | null; authorAssociation: string }[] };
  reviews: { nodes: { createdAt: string; author: GraphQlActor | null; authorAssociation: string }[] };
}

export interface GraphQlPullRequestStatsResponse {
  repository: {
    pullRequests: { nodes: GraphQlPullRequestNode[] };
  } | null;
}

export interface GraphQlIssueResponse {
  repository: {
    issue: {
      databaseId: number;
      number: number;
      title: string;
      body: string | null;
      url: string;
      state: "OPEN" | "CLOSED";
      createdAt: string;
      updatedAt: string;
      closedAt: string | null;
      author: GraphQlActor | null;
      authorAssociation: string;
      reactions: { totalCount: number };
      labels: { nodes: { name: string; description: string | null; color: string | null }[] };
      assignees: { nodes: GraphQlActor[] };
      comments: {
        totalCount: number;
        nodes: {
          author: GraphQlActor | null;
          authorAssociation: string;
          body: string;
          createdAt: string;
        }[];
      };
      timelineItems: {
        nodes: (GraphQlLinkedPullRequestNode | Record<string, never>)[];
      };
    } | null;
  } | null;
}

export interface GraphQlLinkedPullRequestNode {
  source?: GraphQlTimelinePullRequest;
  subject?: GraphQlTimelinePullRequest;
}

export interface GraphQlTimelinePullRequest {
  __typename?: string;
  number?: number;
  state?: "OPEN" | "CLOSED" | "MERGED";
  merged?: boolean;
  url?: string;
  createdAt?: string;
  author?: GraphQlActor | null;
}
