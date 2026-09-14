import { describe, expect, it } from "vitest";

import { analyzeIssueClarity, formSections } from "./issue-clarity";
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

describe("issue forms", () => {
  const form = (repro: string, expected: string, criteria: string) =>
    [
      "### Steps to reproduce",
      "",
      repro,
      "",
      "### Expected behaviour",
      "",
      expected,
      "",
      "### Acceptance criteria",
      "",
      criteria,
    ].join("\n");

  it("reads a filled-in template as answering each question", () => {
    const { signal } = analyzeIssueClarity(
      buildIssue({
        body: form(
          "1. Open the editor.\n2. Paste a multi-line snippet.\n3. Press undo.",
          "Undo should restore the whole paste, not one line of it.",
          "- [ ] Undo restores the whole paste\n- [ ] A test covers the multi-line case",
        ),
      }),
    );

    expect(signal.reasons).toContain("It gives steps to reproduce");
    expect(signal.reasons).toContain("It says what should happen instead");
    expect(signal.reasons).toContain("It lists what counts as done");
  });

  it("does not count a heading that nobody answered", () => {
    // GitHub writes this under a form field that was left blank.
    const { signal } = analyzeIssueClarity(
      buildIssue({
        body: [
          "### Steps to reproduce",
          "",
          "_No response_",
          "",
          "### Expected behaviour",
          "",
          "_No response_",
          "",
          "### What happened",
          "",
          "The editor loses my work when I undo a paste, which is hard to recover from.",
        ].join("\n"),
      }),
    );

    expect(signal.reasons).not.toContain("It gives steps to reproduce");
    expect(signal.reasons).not.toContain("It says what should happen instead");
    expect(signal.concerns).toContain("2 sections of the template were left blank");
  });

  it("names the one section that went unanswered", () => {
    const { signal } = analyzeIssueClarity(
      buildIssue({
        body: [
          "### Steps to reproduce",
          "",
          "1. Open the editor.\n2. Paste a snippet.\n3. Press undo.",
          "",
          "### Expected behaviour",
          "",
          "_No response_",
        ].join("\n"),
      }),
    );

    expect(signal.concerns).toContain("The template asked for the expected behaviour and got no answer");
  });

  it("scores a filled template above the same template left blank", () => {
    const filled = analyzeIssueClarity(
      buildIssue({
        body: form(
          "1. Open the editor.\n2. Paste a multi-line snippet.\n3. Press undo.",
          "Undo should restore the whole paste.",
          "- [ ] Undo restores the whole paste",
        ),
      }),
    );
    const blank = analyzeIssueClarity(
      buildIssue({ body: form("_No response_", "_No response_", "_No response_") }),
    );

    expect(filled.signal.score).toBeGreaterThan(blank.signal.score);
  });

  it("still reads an issue written as prose, with no template at all", () => {
    const { signal } = analyzeIssueClarity(
      buildIssue({
        body:
          "Steps to reproduce: open the editor, paste a multi-line snippet, then press undo. " +
          "Expected behaviour is that the whole paste is restored, but only one line comes back.",
      }),
    );

    expect(signal.reasons).toContain("It gives steps to reproduce");
    expect(signal.reasons).toContain("It says what should happen instead");
  });
});

describe("formSections", () => {
  it("separates answered sections from blank ones", () => {
    const { answered, blank } = formSections(
      [
        "### Steps to reproduce",
        "Open it and press undo.",
        "### Environment",
        "_No response_",
      ].join("\n"),
    );

    expect([...answered]).toEqual(["reproduction"]);
    expect(blank).toEqual(["environment"]);
  });

  it.each(["_No response_", "N/A", "none", "---", "TODO", "   "])(
    "treats %j as no answer",
    (filler) => {
      expect(formSections(`### Expected behaviour\n${filler}`).blank).toEqual(["expected"]);
    },
  );

  it("ignores headings that are not form fields", () => {
    const { answered, blank } = formSections("## Background\nSome context.\n## Notes\nMore.");

    expect([...answered]).toEqual([]);
    expect(blank).toEqual([]);
  });

  it("does not report a field as blank when it is answered elsewhere", () => {
    const { answered, blank } = formSections(
      "### Expected behaviour\n_No response_\n### Expected result\nIt should not crash.",
    );

    expect([...answered]).toEqual(["expected"]);
    expect(blank).toEqual([]);
  });
});
