# Tracer

## Open Source Contribution Finder

## 1. Overview

An open-source tool that helps developers discover GitHub projects and issues worth contributing to.

Instead of simply searching for `good first issue` or matching repository topics, the tool analyzes a repository and its issues to answer:

> "Is this actually a good contribution for me?"

The product should combine GitHub data, repository analysis, issue analysis, and user preferences to rank opportunities and explain why an issue is or isn't a good fit.

The goal is not to replace GitHub. The goal is to reduce the work between:

> "I want to contribute to open source."

and

> "I know exactly what issue I want to work on, where to start, and what I'm getting myself into."

## 2. Core Product

A user provides:

* Languages they know
* Frameworks/libraries they know
* Areas they're interested in
* Skills they want to improve
* Preferred contribution types
* Approximate time available
* Optional experience level

The application searches GitHub for potential projects/issues and analyzes them.

Each recommendation receives a Contribution Fit Score and an explanation.

Example:

```text
Contribution Fit: 91%

Add keyboard shortcuts to command palette

Repository
example/project

React · TypeScript

Difficulty       Easy
Estimated time   2–5 hours
Maintainer       Active
Issue clarity    High

Why this is a good match

✓ Matches your React + TypeScript experience
✓ Small, isolated feature
✓ Maintainer regularly reviews PRs
✓ Clear acceptance criteria
✓ Relevant code appears to be contained in 3 files

Start here

src/components/CommandPalette.tsx
```

## 3. Product Principles

### 3.1 Recommendations over search results

The application should make decisions easier, not simply return hundreds of repositories.

### 3.2 Explain every recommendation

Never show a score without explaining what produced it.

### 3.3 Optimize for realistic contributions

A repository with 100k stars is not necessarily a better contribution opportunity than a repository with 2k stars.

Prioritize:

* Active maintainers
* Clear issues
* Appropriate difficulty
* Relevant technologies
* Reasonable scope
* Healthy contribution history

### 3.4 Avoid pretending certainty

Analysis should use language such as:

* "Likely"
* "Appears to"
* "Based on repository activity"
* "Estimated"
* "Potential blocker"

The system should never claim that an issue will definitely take a specific amount of time.

### 3.5 Dogfood the product

The application should be good enough for its creator to use it to find actual open-source contributions.

## 4. MVP Features

### 4.1 Onboarding

Users create a lightweight profile.

**Skills**

Allow users to select or enter:

* Programming languages
* Frameworks
* Libraries
* Tools
* Databases
* Areas of interest

Example:

```text
Languages
[x] JavaScript
[x] TypeScript
[x] Python

Frameworks
[x] React
[x] Next.js

Interested in
[x] Developer tools
[x] Web applications
[x] UI/UX
[x] AI
```

**Learning goals**

Users can optionally specify technologies they want to learn.

Example:

```text
I want to improve:

[x] TypeScript
[x] Testing
[ ] Rust
[ ] Go
```

This should affect recommendation scoring.

A project doesn't need to perfectly match existing skills if it provides a reasonable opportunity to learn.

**Contribution preferences**

```text
What would you like to contribute?

[x] Features
[x] Bug fixes
[x] UI/UX
[x] Documentation
[ ] Tests
[ ] Developer tooling
```

**Time commitment**

Options:

* < 2 hours
* 2–5 hours
* 5–10 hours
* 10+ hours

## 5. GitHub Integration

Users authenticate with GitHub.

The application should use GitHub's API to retrieve:

* Repositories
* Issues
* Pull requests
* Labels
* Contributors
* Commit activity
* Repository metadata
* Issue history
* PR history

The application should respect GitHub API rate limits and cache data where appropriate.

Do not scrape GitHub pages when an official API endpoint provides the required information.

## 6. Project Discovery

The system searches for repositories that potentially contain suitable contribution opportunities.

Initial filters can include:

* Programming language
* Topics
* Repository activity
* Issue availability
* Open issues
* Repository size
* Recent commits
* Contributor activity
* Issue labels

Potential GitHub labels include:

* `good first issue`
* `help wanted`
* `beginner`
* `easy`
* `documentation`
* `bug`
* `enhancement`

However, labels must not be treated as proof of difficulty.

A repository can have a `good first issue` that is actually difficult, stale, or already being worked on.

## 7. Issue Analysis

Each candidate issue should be analyzed.

### 7.1 Issue status

Determine:

* Is the issue still open?
* Is it assigned?
* Is someone actively working on it?
* Has there been recent discussion?
* Has a PR already been opened?
* Has the issue been inactive for a long time?

### 7.2 Issue clarity

Evaluate whether the issue contains enough information for a contributor to understand what needs to happen.

Potential signals:

* Clear description
* Reproduction steps
* Expected behavior
* Acceptance criteria
* Technical discussion
* Maintainer guidance

Output:

```text
Issue clarity: High
```

or:

```text
Issue clarity: Low

The issue describes the desired behavior but does not specify
how it should work or where the change belongs.
```

### 7.3 Scope estimation

Estimate whether the issue appears:

* Small
* Medium
* Large
* Unclear

This is an estimate, not a promise.

Possible signals:

* Issue complexity
* Number of files likely involved
* Similar historical PRs
* Existing implementation
* Repository architecture

## 8. Repository Health Analysis

Analyze the repository itself.

Signals include:

**Maintenance**

* Recent commits
* Recent releases
* Open issue activity
* PR activity

**Maintainer responsiveness**

Estimate from historical:

* Issue responses
* PR reviews
* PR merge times

**Contribution activity**

Analyze:

* Number of contributors
* Recent contributors
* PR merge frequency
* Ratio of open/closed PRs

**Potential warning signs**

Flag things such as:

```text
Potential concerns

⚠ Issue has been inactive for 11 months
⚠ Maintainer activity appears low
⚠ Similar PRs have remained open for a long time
```

The system should avoid labeling a project "bad" based on a single metric.

## 9. Contribution Fit Score

Each opportunity receives a score from 0–100.

Example:

```text
91% Contribution Fit
```

The score should consider several dimensions.

Initial scoring model:

```text
Skill match              25%
Issue suitability        20%
Repository health        15%
Issue clarity            15%
Difficulty fit           10%
Learning opportunity      5%
Maintainer activity       5%
Competition/activity      5%
```

The exact weights should be configurable in code and refined based on real-world usage.

## 10. Recommendation Explanation

Every recommendation must answer:

> Why did you recommend this to me?

Example:

```text
Why you might like this

✓ Uses TypeScript and React
✓ Matches your interest in developer tools
✓ Issue appears small enough for a weekend contribution
✓ Repository has active maintainers
✓ Similar contributions have been accepted before

Things to know

⚠ You'll need to understand the command-palette architecture
⚠ The repository has a moderately complex local setup
```

This explanation is one of the core features of the product.

## 11. Repository Deep Dive

Users can open a recommendation to investigate it further.

Display:

**Repository overview**

* Description
* Primary technologies
* Stars
* Contributors
* Recent activity
* License
* Open issues
* Open PRs

**Contribution opportunity**

* Issue description
* Labels
* Activity
* Assignees
* Related issues
* Related PRs

**Codebase analysis**

Where possible, identify:

* Relevant directories
* Likely files
* Related functions/components
* Existing implementations
* Tests related to the feature

Example:

```text
Where to start

1. src/components/CommandPalette.tsx
2. src/hooks/useKeyboardShortcuts.ts
3. src/components/__tests__/CommandPalette.test.tsx

These files appear to be related to the functionality
described in the issue.
```

This feature can initially be experimental and should not block the MVP.

## 12. "Should I Take This?" Verdict

Every issue should have a simple recommendation.

Possible verdicts:

**Recommended**

```text
You should probably take this one.

Good skill match, reasonable scope, active maintainers,
and a clear issue description.
```

**Possible**

```text
Worth considering.

The technology matches your interests, but the issue scope
is somewhat unclear.
```

**Not recommended**

```text
Probably skip this one.

The repository is a good match, but this particular issue
appears large and has unresolved architectural discussion.
```

This verdict is the defining product feature.

## 13. Discovery Feed

The homepage should show a ranked feed.

Example:

```text
Your Open Source Opportunities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

91%  Add keyboard shortcuts
     project/example

     React · TypeScript
     Easy · 2–5 hours

     [Why?] [View issue]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

87%  Improve error handling
     project/example-two

     TypeScript · Node.js
     Medium · 5–10 hours

     [Why?] [View issue]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Users can:

* Save
* Dismiss
* Open issue
* View analysis

## 14. Personal Learning Loop

The system should learn from user behavior.

Track:

* Saved issues
* Dismissed issues
* Viewed projects
* Technologies associated with saved issues
* Contribution types
* Difficulty preferences

For example, if a user repeatedly saves:

```text
TypeScript
Developer tools
Small feature work
```

the recommendation engine should gradually prioritize those characteristics.

This can initially be simple rules rather than machine learning.

## 15. Saved Opportunities

Users can bookmark issues.

Saved issue data:

```text
Repository
Issue
Fit score
Date saved
Current status
```

The application should periodically check whether a saved issue:

* Was closed
* Was assigned
* Received a PR
* Changed significantly

Example:

```text
Status changed

"Add dark mode" now has an open PR.

You may want to remove this from your contribution list.
```

## 16. Optional AI Layer

AI should enhance analysis, not become the entire product.

Potential AI tasks:

**Issue understanding**

Summarize a complicated issue.

**Difficulty reasoning**

Explain why an issue appears easy, medium, or difficult.

**Codebase reasoning**

Identify likely files/components involved.

**Contribution plan**

Generate a high-level plan:

```text
Possible approach

1. Add keyboard shortcut configuration
2. Connect it to the command palette
3. Add keyboard event handling
4. Add tests
5. Update documentation
```

**Questions to investigate**

AI can identify things the contributor should verify before starting.

Example:

```text
Before starting, check:

- Whether keyboard shortcuts already exist elsewhere
- Whether this feature needs browser-specific handling
- Whether maintainers have discussed a preferred implementation
```

AI-generated conclusions should be clearly distinguished from directly observed GitHub data.

## 17. Technology Stack

The exact stack can change, but the initial implementation should favor technologies suitable for an open-source developer tool.

Suggested:

**Frontend**

* Next.js
* TypeScript
* Tailwind CSS

**Backend**

* Next.js server/API routes or a small dedicated backend

**Database**

* PostgreSQL

**Authentication**

* GitHub OAuth

**GitHub API**

* GitHub REST API
* GitHub GraphQL API where useful

**AI**

* OpenAI API

AI should be abstracted behind a service so the application can later support other providers.

## 18. Architecture

Suggested high-level architecture:

```text
                    ┌─────────────────┐
                    │     GitHub      │
                    │      API        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ GitHub Data     │
                    │ Collector       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Analysis        │
                    │ Engine          │
                    ├─────────────────┤
                    │ Repo Health     │
                    │ Issue Analysis  │
                    │ Skill Matching  │
                    │ Difficulty      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Recommendation  │
                    │ Engine          │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Web App     │
                    └─────────────────┘
```

## 19. Data Model

Initial entities:

**User**

```text
id
github_id
username
created_at
```

**UserSkill**

```text
user_id
skill
type
```

`type`:

* experienced
* learning
* interested

**Repository**

```text
id
github_id
owner
name
description
language
stars
forks
open_issues
last_activity
```

**Issue**

```text
id
github_id
repository_id
title
body
labels
state
author
created_at
updated_at
closed_at
```

**Analysis**

```text
issue_id
skill_match
issue_clarity
difficulty
repository_health
maintainer_activity
learning_value
overall_score
verdict
reasoning
created_at
```

**SavedOpportunity**

```text
user_id
issue_id
created_at
```

## 20. API Design

Potential internal endpoints:

```text
GET /api/opportunities
GET /api/opportunities/:id
GET /api/repositories/:owner/:repo
GET /api/issues/:owner/:repo/:issue
POST /api/opportunities/:id/save
DELETE /api/opportunities/:id/save

GET /api/profile
PUT /api/profile
```

GitHub-specific services should remain separate from recommendation logic.

## 21. MVP Scope

The first public release should include only:

**Required**

* GitHub authentication
* User skill profile
* GitHub repository/issue discovery
* Basic repository health analysis
* Issue analysis
* Skill matching
* Contribution Fit Score
* Recommendation explanation
* Opportunity feed
* Save/dismiss

**Not required for V1**

* Automatic PR creation
* Automatic issue commenting
* Full codebase AI analysis
* Social features
* Leaderboards
* Team accounts
* Browser extension
* Mobile application
* Advanced machine learning
* Automated contribution

The first goal is:

> Find me an open-source issue that I should realistically contribute to.

## 22. Future Features

Once the core product works, potential additions include:

**Contribution Roadmap**

Turn an issue into a personalized plan.

```text
Your contribution plan

1. Fork repository
2. Set up development environment
3. Read these files
4. Understand this component
5. Implement change
6. Add tests
7. Open PR
```

**Codebase Explorer**

Allow users to ask:

> "Where would I make this change?"

and get repository-specific guidance.

**Contribution Readiness**

After analyzing a repository:

```text
Setup difficulty: Medium

Estimated setup:
20–40 minutes
```

**Maintainer Fit**

Learn which projects have contribution patterns likely to suit the user.

**Contribution History**

Track:

* Issues worked on
* PRs opened
* PRs merged
* Technologies learned
* Contributions over time

**GitHub Profile Analysis**

Analyze a user's GitHub profile and automatically infer skills from:

* Repositories
* Languages
* Contributions
* PRs
* Issues

This could reduce onboarding significantly.

## 23. Open Source Strategy

The project itself should be open source.

Priorities:

1. Clear README
2. Easy local setup
3. Good contribution guide
4. Issue templates
5. Architecture documentation
6. Good first issues
7. Transparent recommendation methodology

The project should eventually be able to recommend its own issues to potential contributors.

That creates a useful feedback loop:

> The tool finds contributors for GitHub projects, including itself.

## 24. Success Criteria

The project is successful if a new user can:

1. Connect GitHub.
2. Tell the application what they know and want to learn.
3. Receive a small set of relevant open-source opportunities.
4. Understand why each opportunity was recommended.
5. Pick one without needing to manually investigate dozens of repositories.
6. Open the GitHub issue and start contributing.

The most important metric is not:

> Number of repositories indexed.

It is:

> How often does a recommendation result in a user actually attempting a contribution?

## 25. Product Positioning

Do not position this as:

> "A better GitHub search."

Position it as:

> "Find open-source work worth doing."

Or:

> "Stop searching. Start contributing."

The central product promise is:

> We don't just find open issues. We help you decide which ones are worth your time.
