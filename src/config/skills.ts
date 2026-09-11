/**
 * Skill catalog and technology normalisation.
 *
 * Onboarding offers these as suggestions; users can type anything else. The
 * normaliser exists because the same technology arrives spelled three different
 * ways: from GitHub's language stats ("JavaScript"), from repository topics
 * ("javascript", "nodejs"), and from whatever the user typed ("JS").
 */

import type { ContributionType, ExperienceLevel } from "@/types";

export const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "Kotlin",
  "Swift",
  "C",
  "C++",
  "C#",
  "Ruby",
  "PHP",
  "Elixir",
  "Scala",
  "Dart",
  "Shell",
  "SQL",
  "HTML",
  "CSS",
] as const;

export const FRAMEWORKS = [
  "React",
  "Next.js",
  "Vue",
  "Nuxt",
  "Svelte",
  "Angular",
  "Node.js",
  "Deno",
  "Express",
  "NestJS",
  "Django",
  "Flask",
  "FastAPI",
  "Rails",
  "Laravel",
  "Spring",
  "Flutter",
  "React Native",
  "Electron",
  "Tailwind CSS",
] as const;

export const TOOLS = [
  "Docker",
  "Kubernetes",
  "Terraform",
  "GitHub Actions",
  "Webpack",
  "Vite",
  "ESLint",
  "Jest",
  "Vitest",
  "Playwright",
  "Cypress",
  "Prisma",
  "Drizzle",
  "GraphQL",
  "gRPC",
  "Redis",
  "PostgreSQL",
  "MySQL",
  "SQLite",
  "MongoDB",
] as const;

export const INTERESTS = [
  "Developer tools",
  "Web applications",
  "UI/UX",
  "AI",
  "Machine learning",
  "Data",
  "DevOps",
  "Security",
  "Testing",
  "Documentation",
  "Accessibility",
  "Performance",
  "CLI tools",
  "Mobile",
  "Games",
  "Education",
  "Open data",
  "Databases",
  "Networking",
  "Compilers",
] as const;

export const CONTRIBUTION_TYPES: { value: ContributionType; label: string; hint: string }[] = [
  { value: "features", label: "Features", hint: "New behaviour, usually the largest scope" },
  { value: "bug-fixes", label: "Bug fixes", hint: "Reproducible problems with a known expectation" },
  { value: "ui-ux", label: "UI/UX", hint: "Interface, interaction and visual work" },
  { value: "documentation", label: "Documentation", hint: "Guides, references, examples" },
  { value: "tests", label: "Tests", hint: "Coverage, regression tests, test infrastructure" },
  { value: "tooling", label: "Developer tooling", hint: "Build, lint, CI, release automation" },
];

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; hint: string }[] = [
  {
    value: "beginner",
    label: "Beginner",
    hint: "New to open source, or new to contributing in this stack",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    hint: "Comfortable reading an unfamiliar codebase",
  },
  {
    value: "advanced",
    label: "Advanced",
    hint: "Happy to take on architectural or ambiguous work",
  },
];

/**
 * Maps the many spellings of one technology onto a canonical name. Keys are
 * lowercased; values must appear in one of the catalogs above (or be a
 * reasonable canonical name for something that does not).
 */
const ALIASES: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  node: "Node.js",
  nodejs: "Node.js",
  "node-js": "Node.js",
  ts: "TypeScript",
  typescript: "TypeScript",
  py: "Python",
  python: "Python",
  python3: "Python",
  golang: "Go",
  go: "Go",
  rs: "Rust",
  rust: "Rust",
  "c#": "C#",
  csharp: "C#",
  dotnet: "C#",
  "c++": "C++",
  cpp: "C++",
  cplusplus: "C++",
  rb: "Ruby",
  ruby: "Ruby",
  rails: "Rails",
  "ruby-on-rails": "Rails",
  php: "PHP",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  elixir: "Elixir",
  scala: "Scala",
  dart: "Dart",
  shell: "Shell",
  bash: "Shell",
  sh: "Shell",
  powershell: "Shell",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  scss: "CSS",
  sass: "CSS",
  react: "React",
  reactjs: "React",
  "react-js": "React",
  nextjs: "Next.js",
  "next-js": "Next.js",
  next: "Next.js",
  vue: "Vue",
  vuejs: "Vue",
  nuxt: "Nuxt",
  nuxtjs: "Nuxt",
  svelte: "Svelte",
  sveltekit: "Svelte",
  angular: "Angular",
  deno: "Deno",
  express: "Express",
  expressjs: "Express",
  nestjs: "NestJS",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  laravel: "Laravel",
  spring: "Spring",
  "spring-boot": "Spring",
  flutter: "Flutter",
  "react-native": "React Native",
  reactnative: "React Native",
  electron: "Electron",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  "tailwind-css": "Tailwind CSS",
  docker: "Docker",
  k8s: "Kubernetes",
  kubernetes: "Kubernetes",
  terraform: "Terraform",
  "github-actions": "GitHub Actions",
  webpack: "Webpack",
  vite: "Vite",
  eslint: "ESLint",
  jest: "Jest",
  vitest: "Vitest",
  playwright: "Playwright",
  cypress: "Cypress",
  prisma: "Prisma",
  drizzle: "Drizzle",
  graphql: "GraphQL",
  grpc: "gRPC",
  redis: "Redis",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
  mongodb: "MongoDB",
  mongo: "MongoDB",
};

/** Topics that describe a domain rather than a technology. */
const INTEREST_ALIASES: Record<string, string> = {
  "developer-tools": "Developer tools",
  devtools: "Developer tools",
  "dev-tools": "Developer tools",
  cli: "CLI tools",
  "command-line": "CLI tools",
  terminal: "CLI tools",
  ui: "UI/UX",
  ux: "UI/UX",
  "design-system": "UI/UX",
  frontend: "Web applications",
  "front-end": "Web applications",
  webapp: "Web applications",
  web: "Web applications",
  ai: "AI",
  llm: "AI",
  "artificial-intelligence": "AI",
  "machine-learning": "Machine learning",
  ml: "Machine learning",
  "deep-learning": "Machine learning",
  "data-science": "Data",
  analytics: "Data",
  database: "Databases",
  devops: "DevOps",
  infrastructure: "DevOps",
  ci: "DevOps",
  security: "Security",
  cryptography: "Security",
  testing: "Testing",
  "test-automation": "Testing",
  documentation: "Documentation",
  docs: "Documentation",
  accessibility: "Accessibility",
  a11y: "Accessibility",
  performance: "Performance",
  mobile: "Mobile",
  android: "Mobile",
  ios: "Mobile",
  game: "Games",
  gamedev: "Games",
  education: "Education",
  learning: "Education",
  "open-data": "Open data",
  networking: "Networking",
  compiler: "Compilers",
  parser: "Compilers",
};

/**
 * Canonicalises a technology name. Returns the input trimmed if we have never
 * heard of it — an unknown technology is still a real user skill.
 */
export function normalizeTechnology(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  return ALIASES[key] ?? ALIASES[key.replace(/-/g, "")] ?? raw.trim();
}

/** Canonicalises an interest, or returns null if the input looks technical. */
export function normalizeInterest(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  if (INTEREST_ALIASES[key]) return INTEREST_ALIASES[key];
  const titled = raw.trim();
  return INTERESTS.some((i) => i.toLowerCase() === titled.toLowerCase()) ? titled : null;
}

/**
 * Pulls the technologies a repository actually uses out of its language stats
 * and topics. Topics are noisy, so anything that does not resolve to a known
 * technology is dropped here rather than shown to the user as a "skill".
 */
export function technologiesFromRepository(input: {
  primaryLanguage: string | null;
  languages: Record<string, number>;
  topics: string[];
}): string[] {
  const found = new Set<string>();
  if (input.primaryLanguage) found.add(normalizeTechnology(input.primaryLanguage));

  const totalBytes = Object.values(input.languages).reduce((sum, n) => sum + n, 0);
  for (const [language, bytes] of Object.entries(input.languages)) {
    // A language that is 2% of the codebase is not a technology you need.
    if (totalBytes > 0 && bytes / totalBytes < 0.05) continue;
    found.add(normalizeTechnology(language));
  }

  for (const topic of input.topics) {
    const key = topic.toLowerCase();
    if (ALIASES[key] || ALIASES[key.replace(/-/g, "")]) {
      found.add(normalizeTechnology(topic));
    }
  }

  return [...found];
}

/**
 * The subset of a user's skills that can be sent to GitHub as `language:`.
 *
 * Issue search silently ignores an unknown language and returns everything, so
 * `language:React` does not fail — it quietly searches the whole of GitHub.
 * Anything we know to be a framework, tool or database is therefore dropped
 * here. A skill we have never heard of is kept: it may well be a language we
 * simply do not have in the catalog.
 */
export function languageCandidates(skills: string[]): string[] {
  const notLanguages = new Set(
    [...FRAMEWORKS, ...TOOLS].map((item) => item.toLowerCase()),
  );
  const languages = new Set(LANGUAGES.map((item) => item.toLowerCase()));

  const found = new Set<string>();
  for (const skill of skills) {
    const canonical = normalizeTechnology(skill);
    const key = canonical.toLowerCase();
    if (notLanguages.has(key)) continue;
    if (languages.has(key) || !INTEREST_ALIASES[key]) found.add(canonical);
  }
  return [...found];
}

/** Pulls domain interests out of repository topics and description. */
export function interestsFromRepository(input: {
  topics: string[];
  description: string | null;
}): string[] {
  const found = new Set<string>();
  for (const topic of input.topics) {
    const interest = normalizeInterest(topic);
    if (interest) found.add(interest);
  }
  const description = (input.description ?? "").toLowerCase();
  for (const [key, interest] of Object.entries(INTEREST_ALIASES)) {
    if (key.length > 3 && description.includes(key.replace(/-/g, " "))) {
      found.add(interest);
    }
  }
  return [...found];
}
