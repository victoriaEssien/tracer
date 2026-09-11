/**
 * Issue collection.
 *
 * One GraphQL call gets the issue, its labels, its assignees, the first slice of
 * its comments, and any pull request that references it. Doing this over REST
 * would be four calls and would still miss the cross-references.
 */

import type { CollectedIssue, LinkedPullRequest } from "@/types";

import type { GitHubClient } from "./client";
import type {
  GraphQlIssueResponse,
  GraphQlLinkedPullRequestNode,
  GraphQlTimelinePullRequest,
} from "./types";

/** Enough comments to judge clarity and whether someone has claimed the issue. */
const COMMENT_LIMIT = 30;

const ISSUE_QUERY = /* GraphQL */ `
  query Issue($owner: String!, $name: String!, $number: Int!, $comments: Int!) {
    repository(owner: $owner, name: $name) {
      issue(number: $number) {
        databaseId
        number
        title
        body
        url
        state
        createdAt
        updatedAt
        closedAt
        authorAssociation
        author {
          login
        }
        reactions {
          totalCount
        }
        labels(first: 25) {
          nodes {
            name
            description
            color
          }
        }
        assignees(first: 10) {
          nodes {
            login
          }
        }
        comments(first: $comments) {
          totalCount
          nodes {
            authorAssociation
            body
            createdAt
            author {
              login
            }
          }
        }
        timelineItems(first: 30, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
          nodes {
            ... on CrossReferencedEvent {
              source {
                __typename
                ... on PullRequest {
                  number
                  state
                  merged
                  url
                  createdAt
                  author {
                    login
                  }
                }
              }
            }
            ... on ConnectedEvent {
              subject {
                __typename
                ... on PullRequest {
                  number
                  state
                  merged
                  url
                  createdAt
                  author {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function collectIssue(
  client: GitHubClient,
  owner: string,
  name: string,
  number: number,
): Promise<CollectedIssue | null> {
  const data = await client.graphql<GraphQlIssueResponse>(ISSUE_QUERY, {
    owner,
    name,
    number,
    comments: COMMENT_LIMIT,
  });

  const issue = data?.repository?.issue;
  if (!issue) return null;

  return {
    githubId: issue.databaseId,
    number: issue.number,
    repositoryFullName: `${owner}/${name}`,
    title: issue.title,
    body: issue.body,
    htmlUrl: issue.url,
    state: issue.state === "OPEN" ? "open" : "closed",
    author: issue.author?.login ?? null,
    authorAssociation: issue.authorAssociation,
    labels: issue.labels.nodes.map((label) => ({
      name: label.name,
      description: label.description,
      color: label.color,
    })),
    assignees: issue.assignees.nodes.map((assignee) => assignee.login),
    commentCount: issue.comments.totalCount,
    reactionCount: issue.reactions.totalCount,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    closedAt: issue.closedAt,
    comments: issue.comments.nodes.map((comment) => ({
      author: comment.author?.login ?? null,
      authorAssociation: comment.authorAssociation,
      body: comment.body,
      createdAt: comment.createdAt,
    })),
    linkedPullRequests: extractLinkedPullRequests(issue.timelineItems.nodes),
  };
}

/**
 * A lighter refresh for the saved-opportunity job: state, assignees and linked
 * pull requests, without the comment history.
 */
export async function refreshIssueStatus(
  client: GitHubClient,
  owner: string,
  name: string,
  number: number,
): Promise<Pick<
  CollectedIssue,
  "state" | "assignees" | "linkedPullRequests" | "updatedAt" | "closedAt" | "commentCount"
> | null> {
  const issue = await collectIssue(client, owner, name, number);
  if (!issue) return null;
  return {
    state: issue.state,
    assignees: issue.assignees,
    linkedPullRequests: issue.linkedPullRequests,
    updatedAt: issue.updatedAt,
    closedAt: issue.closedAt,
    commentCount: issue.commentCount,
  };
}

function extractLinkedPullRequests(
  nodes: (GraphQlLinkedPullRequestNode | Record<string, never>)[],
): LinkedPullRequest[] {
  const found = new Map<number, LinkedPullRequest>();

  for (const node of nodes) {
    const candidate = (node as GraphQlLinkedPullRequestNode).source ??
      (node as GraphQlLinkedPullRequestNode).subject;
    if (!isPullRequest(candidate)) continue;

    found.set(candidate.number, {
      number: candidate.number,
      state: candidate.state === "OPEN" ? "open" : "closed",
      merged: Boolean(candidate.merged),
      author: candidate.author?.login ?? null,
      createdAt: candidate.createdAt,
      htmlUrl: candidate.url,
    });
  }

  return [...found.values()];
}

function isPullRequest(
  candidate: GraphQlTimelinePullRequest | undefined,
): candidate is Required<Pick<GraphQlTimelinePullRequest, "number" | "url" | "createdAt">> &
  GraphQlTimelinePullRequest {
  return Boolean(
    candidate &&
      candidate.__typename === "PullRequest" &&
      typeof candidate.number === "number" &&
      candidate.url &&
      candidate.createdAt,
  );
}
