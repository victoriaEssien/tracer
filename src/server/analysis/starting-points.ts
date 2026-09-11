/**
 * Where to start.
 *
 * Only observed evidence lives here: paths somebody actually wrote in the issue
 * or its comments, and top-level directories whose names match what the issue
 * talks about. Anything the AI layer guesses is kept separate and rendered as
 * inference (spec section 16), so these two never get confused.
 */

import type { CollectedIssue, StartingPoint } from "@/types";

import { extractFilePaths } from "./scope-estimation";

const MAINTAINER_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

/** Directories that are never a useful answer to "where do I start". */
const UNINTERESTING_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  "vendor",
  "target",
  ".github",
  "assets",
  "images",
  "static",
]);

export function findStartingPoints(input: {
  issue: CollectedIssue;
  topLevelPaths: string[];
}): StartingPoint[] {
  const { issue, topLevelPaths } = input;
  const found = new Map<string, StartingPoint>();

  for (const path of extractFilePaths(`${issue.title}\n${issue.body ?? ""}`)) {
    found.set(path, {
      path,
      reason: "Named in the issue description",
      source: "observed",
    });
  }

  for (const comment of issue.comments) {
    const fromMaintainer = MAINTAINER_ASSOCIATIONS.has(comment.authorAssociation ?? "");
    for (const path of extractFilePaths(comment.body)) {
      // A maintainer pointing at a file beats the same path in a drive-by
      // comment, so it is allowed to overwrite an existing entry.
      if (found.has(path) && !fromMaintainer) continue;
      found.set(path, {
        path,
        reason: fromMaintainer
          ? "Pointed at by a maintainer in the comments"
          : "Mentioned in the issue discussion",
        source: "observed",
      });
    }
  }

  if (found.size === 0) {
    for (const path of matchDirectories(issue, topLevelPaths)) {
      found.set(path, {
        path,
        reason: "The issue mentions this part of the project by name",
        source: "observed",
      });
    }
  }

  return [...found.values()].slice(0, 6);
}

/** Top-level directories whose name appears in the issue's own words. */
function matchDirectories(issue: CollectedIssue, topLevelPaths: string[]): string[] {
  const text = `${issue.title}\n${issue.body ?? ""}`.toLowerCase();
  return topLevelPaths
    .filter((path) => !UNINTERESTING_DIRECTORIES.has(path.toLowerCase()))
    .filter((path) => path.length >= 4)
    .filter((path) => new RegExp(`\\b${escapeRegExp(path.toLowerCase())}\\b`).test(text))
    .slice(0, 3);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
