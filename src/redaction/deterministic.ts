import type { PiiCategory } from "./categories.js";

export interface RedactionResult {
  text: string;
  findingCount: number;
  categories: PiiCategory[];
}

interface ReplacementRule {
  category: PiiCategory;
  pattern: RegExp;
  placeholder: string;
}

const replacementRules: ReplacementRule[] = [
  {
    category: "url",
    pattern:
      /https?:\/\/[^\s"'<>)\]]+/gi,
    placeholder: "URL",
  },
  {
    category: "email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    placeholder: "EMAIL",
  },
  {
    category: "phone",
    pattern: /\b(?:\+?1[-.\s]*)?(?:\(?\d{3}\)?[-.\s]*)\d{3}[-.\s]*\d{4}\b/g,
    placeholder: "PHONE",
  },
  {
    category: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    placeholder: "SSN",
  },
  {
    category: "tax_id",
    pattern: /\b\d{2}-\d{7}\b/g,
    placeholder: "TAX_ID",
  },
  {
    category: "claim_number",
    pattern: /\b(?:claim|case|matter)[\s:#-]*[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    placeholder: "CLAIM_NUMBER",
  },
  {
    category: "policy_number",
    pattern: /\b(?:policy|member)[\s:#-]*[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    placeholder: "POLICY_NUMBER",
  },
  {
    category: "account_number",
    pattern:
      /\b(?:account|acct|routing|iban|swift|wire|card)[\s:#-]*[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    placeholder: "ACCOUNT_NUMBER",
  },
];

export function normalizeText(value: string): string {
  return value
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\u0000", "")
    .replaceAll("\u00a0", " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export interface RedactionFinding {
  original: string;
  redacted: string;
  category: PiiCategory;
}

export interface RedactionWithFindingsResult extends RedactionResult {
  findings: RedactionFinding[];
}

export function redactTextWithFindings(
  value: string,
): RedactionWithFindingsResult {
  const normalized = normalizeText(value);

  if (!normalized) {
    return { text: "", findingCount: 0, categories: [], findings: [] };
  }

  let text = normalized;
  const categories = new Set<PiiCategory>();
  let findingCount = 0;
  const findings: RedactionFinding[] = [];
  const placeholders = new Map<string, string>();
  const counts = new Map<string, number>();

  for (const rule of replacementRules) {
    text = text.replace(rule.pattern, (match) => {
      const normalizedMatch = match.trim().toLowerCase();
      if (!normalizedMatch) return match;

      const cacheKey = `${rule.category}:${normalizedMatch}`;
      let placeholder = placeholders.get(cacheKey);
      let isNew = false;

      if (!placeholder) {
        const nextCount = (counts.get(rule.placeholder) ?? 0) + 1;
        counts.set(rule.placeholder, nextCount);
        placeholder = `[${rule.placeholder}_${nextCount}]`;
        placeholders.set(cacheKey, placeholder);
        isNew = true;
      }

      if (isNew) {
        findings.push({
          original: match,
          redacted: placeholder,
          category: rule.category,
        });
      }

      categories.add(rule.category);
      findingCount += 1;
      return placeholder;
    });
  }

  return { text, findingCount, categories: [...categories], findings };
}

export function redactText(value: string): RedactionResult {
  const normalized = normalizeText(value);

  if (!normalized) {
    return { text: "", findingCount: 0, categories: [] };
  }

  let text = normalized;
  const categories = new Set<PiiCategory>();
  let findingCount = 0;
  const placeholders = new Map<string, string>();
  const counts = new Map<string, number>();

  for (const rule of replacementRules) {
    text = text.replace(rule.pattern, (match) => {
      const normalizedMatch = match.trim().toLowerCase();
      if (!normalizedMatch) return match;

      const cacheKey = `${rule.category}:${normalizedMatch}`;
      let placeholder = placeholders.get(cacheKey);

      if (!placeholder) {
        const nextCount = (counts.get(rule.placeholder) ?? 0) + 1;
        counts.set(rule.placeholder, nextCount);
        placeholder = `[${rule.placeholder}_${nextCount}]`;
        placeholders.set(cacheKey, placeholder);
      }

      categories.add(rule.category);
      findingCount += 1;
      return placeholder;
    });
  }

  return { text, findingCount, categories: [...categories] };
}
