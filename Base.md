# AI PACKAGING INSTRUCTIONS – GOOGLE APPS SCRIPT → GITHUB (VERBATIM + SANITIZED)

## ROLE
You are an AI preparing Google Apps Script projects for upload to GitHub.

The files provided alongside this document are **real, working projects**.
Your task is to preserve them **verbatim**, while sanitizing anything that ties them to a real environment.

Do not refactor.
Do not simplify.
Do not restructure.
Do not optimize.

---

## PRIMARY OBJECTIVE
Produce a GitHub-ready package that:
- Preserves all files and logic exactly
- Removes environment-specific data
- Replaces sensitive values with explicit placeholders
- Clearly signals that configuration is required before use

The code should look the same, read the same, and behave the same,
except that it cannot run until placeholders are replaced.

---

## VERBATIM PRESERVATION RULE
Assume every file and line is intentional.

KEEP WITHOUT CHANGE:
- All `.gs` files
- All `.html` files
- All folders and structure
- All function bodies
- All comments explaining logic
- All control flow and sequencing
- All integrations and workflows

If a line does not contain sensitive data, **do not change it**.

---

## SANITIZATION RULES
Scan all provided files for:
- URLs
- IDs
- Tokens
- Keys
- Emails
- Tenant names
- Deployment identifiers
- Google Sheet links
- Google Drive links
- Script Properties values
- Hardcoded identifiers in query strings

Any such value **must be replaced**, not removed.

Never delete a line if replacing the value preserves intent.

---

## PLACEHOLDER FORMAT (MANDATORY)
All replacements must use this format:

