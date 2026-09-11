/**
 * Next declares `*.module.css` but not plain `*.css`, so a global stylesheet
 * import has no type to resolve to. TypeScript only complains under
 * `noUncheckedSideEffectImports`, which editors tend to enable before `tsc`
 * does — hence the declaration rather than a suppression.
 */
declare module "*.css";
