export const piiCategories = [
  "person_name",
  "company_name",
  "street_address",
  "email",
  "phone",
  "ssn",
  "tax_id",
  "account_number",
  "claim_number",
  "policy_number",
  "url",
  "other",
] as const;

export type PiiCategory = (typeof piiCategories)[number];
