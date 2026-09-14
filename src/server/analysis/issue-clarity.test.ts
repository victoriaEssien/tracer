import { describe, expect, it } from "vitest";

import { analyzeIssueClarity } from "./issue-clarity";
import { buildComment, buildIssue } from "./fixtures";

describe("analyzeIssueClarity", () => {
  it("treats a title with no body as the worst case, and is sure about it", () => {
    const { clarity, signal } = analyzeIssueClarity(buildIssue({ body: null }));

    expect(clarity).toBe("low");
    expect(signal.score).toBeCloseTo(0.08);
    // The one case where there is nothing to be uncertain about.
    expect(signal.confidence).toBe("high");
    expect(signal.concerns).toContain("A title and nothing else");
  });

  it("treats a whitespace-only body the same as no body", () => {
    expect(analyzeIssueClarity(buildIssue({ body: "   \n\n  " })).signal.score).toBeCloseTo(0.08);
  });

  it("rates a well-structured bug report highly, and says why", () => {
    const { clarity, signal } = analyzeIssueClarity(
      buildIssue({
        body: [
          "### What happens",
          "",
          "The `<Chart />` axis labels overlap on a narrow viewport, which makes them unreadable.",
          "",
          "### Steps to reproduce",
          "",
          "1. Render the chart with 30 days of data.",
          "2. Narrow the viewport to 375px.",
          "3. Look at the x-axis.",
          "",
          "### Expected behaviour",
          "",
          "Labels should thin out rather than overlap.",
          "",
          "### Acceptance criteria",
          "",
          "- [ ] Ticks thin out based on width",
          "- [ ] A test covers the narrow case",
          "",
          "The logic lives in `src/axis/ticks.ts`.",
        ].join("\n"),
      }),
    );

    expect(clarity).toBe("high");
    expect(signal.reasons).toContain("It gives steps to reproduce");
    expect(signal.reasons).toContain("It says what should happen instead");
    expect(signal.reasons).toContain("It lists what counts as done");
    expect(signal.reasons).toContain("It points at specific files");
  });

  it("penalises a body that only asserts something is broken", () => {
    const vague = analyzeIssueClarity(buildIssue({ body: "It doesn't work" }));

    expect(vague.clarity).toBe("low");
    expect(vague.signal.concerns).toContain("It describes the problem but not the fix");
    expect(vague.signal.concerns).toContain("Nobody has said what finished looks like");
  });

  it("lets a maintainer's follow-up rescue a thin description", () => {
    const body = "The importer drops the last row of a CSV when the file has no trailing newline.";

    const alone = analyzeIssueClarity(buildIssue({ body }));
    const withFollowUp = analyzeIssueClarity(
      buildIssue({
        body,
        comments: [
          buildComment({
            authorAssociation: "MEMBER",
            body:
              "Confirmed. The off-by-one is in the row splitter, which assumes every record " +
              "ends with a newline. Fixing it means treating the final chunk as a row when it " +
              "is non-empty, and adding a case to the parser tests.",
          }),
        ],
      }),
    );

    expect(withFollowUp.signal.score).toBeGreaterThan(alone.signal.score);
    expect(withFollowUp.signal.reasons).toContain("A maintainer filled in the gaps in the comments");
  });

  it("ignores a long comment from someone who is not a maintainer", () => {
    const body = "The importer drops the last row of a CSV when the file has no trailing newline.";
    const comment = buildComment({ authorAssociation: "NONE", body: "I see this too. ".repeat(20) });

    expect(analyzeIssueClarity(buildIssue({ body, comments: [comment] })).signal.reasons).not.toContain(
      "A maintainer filled in the gaps in the comments",
    );
  });

  it("marks an issue down while the approach is still being argued about", () => {
    const body = [
      "### Expected behaviour",
      "",
      "The retry budget should be configurable per client rather than global.",
      "",
      "### Acceptance criteria",
      "",
      "- [ ] A per-client option exists",
      "- [ ] The global default still applies when it is unset",
    ].join("\n");

    const settled = analyzeIssueClarity(buildIssue({ body }));
    const arguing = analyzeIssueClarity(
      buildIssue({
        body,
        comments: [buildComment({ body: "Not sure whether this belongs on the client at all." })],
      }),
    );

    expect(arguing.signal.score).toBeLessThan(settled.signal.score);
    expect(arguing.signal.concerns).toContain("The approach is still being argued about");
  });

  it("keeps the score inside 0 and 1 however the signals stack up", () => {
    const piledOn = analyzeIssueClarity(
      buildIssue({ body: "It is broken. Not sure how to fix. Please fix." }),
    );

    expect(piledOn.signal.score).toBeGreaterThanOrEqual(0);
    expect(piledOn.signal.score).toBeLessThanOrEqual(1);
  });
});
