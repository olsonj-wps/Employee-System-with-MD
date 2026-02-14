**`AI_GITHUB_PACKAGING.md`**

---

# AI PACKAGING INSTRUCTIONS – GOOGLE APPS SCRIPT → GITHUB

(VERBATIM PRESERVATION + SANITIZATION)

## ROLE

You are an AI preparing Google Apps Script projects for upload to GitHub.

The files provided alongside this document are **real, working projects**.
Your task is to preserve them **verbatim**, while sanitizing anything that ties them to a real environment.

Do not refactor.
Do not simplify.
Do not restructure.
Do not optimize.

These instructions apply to all files provided in the same directory as this document.

---

## PRIMARY OBJECTIVE

Produce a GitHub-ready package that:

* Preserves all files and logic exactly
* Removes environment-specific data only
* Replaces sensitive values with explicit placeholders
* Clearly signals that configuration is required before use

This task does **not** include reducing file count or simplifying structure.
All original files should remain unless explicitly disallowed below.

The code should look the same, read the same, and behave the same,
except that it cannot run until placeholders are replaced.

---

## VERBATIM PRESERVATION RULE

Assume every file and every line is intentional.

KEEP WITHOUT CHANGE:

* All `.gs` files
* All `.html` files
* All folders and directory structure
* All function bodies
* All comments explaining logic
* All control flow and sequencing
* All integrations and workflows

If a line does not contain sensitive data, **do not change it**.

---

## SANITIZATION RULES

Scan all provided files for:

* URLs
* IDs
* Tokens
* Keys
* Emails
* Tenant names
* Deployment identifiers
* Google Sheet links
* Google Drive links
* Script Properties values
* Hardcoded identifiers embedded in query strings or URLs

Any such value **must be replaced**, not removed.

Never delete a line if replacing the value preserves intent.

Example of a hardcoded identifier that must be sanitized:

```js
const reportUrl =
  'https://example.workday.com/ccx/service/customreport2/tenant123/My_Report';
```

---

## PLACEHOLDER FORMAT (MANDATORY)

All replacements must use this format:

```
<<PLACEHOLDER_NAME>>
```

Rules:

* ALL CAPS
* Descriptive
* No fake values
* No commented originals
* No empty strings
* Reuse the same placeholder name consistently if the same value appears in multiple files

Examples:

```js
const WORKDAY_RAAS_URL = '<<WORKDAY_RAAS_URL>>';
const GOOGLE_SHEET_ID = '<<GOOGLE_SHEET_ID>>';
const API_TOKEN = '<<API_TOKEN>>';
const DRIVE_FOLDER_ID = '<<DRIVE_FOLDER_ID>>';
```

Inline usage:

```js
UrlFetchApp.fetch('<<WORKDAY_RAAS_URL>>', options);
```

---

## SCRIPT PROPERTIES

If the code reads Script Properties:

* Keep the access logic exactly
* Do not include real values
* Replace expected keys with placeholders if they appear in code
* Document required properties in README.md

Example:

```js
const token = PropertiesService.getScriptProperties()
  .getProperty('<<API_TOKEN>>');
```

---

## FILE REMOVAL RULE

Remove a file **only if** it exists solely to:

* Store credentials
* Store secrets
* Store environment-specific configuration
* Contain auto-generated metadata with no instructional value

Do not remove files that express logic, structure, or intent.

---

## README.md (REQUIRED)

Add a README.md at the root of each project.

The README is the primary artifact.

Use this template:

```
# <Project Name>

## Description
Brief description of what this automation or integration does.

## Environment
- Google Apps Script
- Google Sheets
- External system (generic description only)

## Configuration Required
Before use, replace or supply the following placeholders:
- <<WORKDAY_RAAS_URL>>
- <<API_TOKEN>>
- <<GOOGLE_SHEET_ID>>

These values are intentionally removed from source control.

## Notes
This repository contains verbatim project code with sanitized placeholders.
```

Do not include:

* Real examples
* Screenshots
* Logs
* Deployment instructions tied to a real tenant

---

## EXECUTION EXPECTATION

The code is allowed to fail when placeholders are not replaced.
Do not add guards or defaults that allow execution with placeholders present.

Fail fast and visibly.

---

## FINAL VALIDATION CHECKLIST

Before completing the package, confirm:

* All logic remains intact
* No real URLs remain
* No IDs resemble real values
* No credentials exist anywhere
* Placeholders are obvious and consistent
* README.md exists and is accurate

If uncertain, remove the value and document it.

---

## OUTPUT EXPECTATION

Return a clean, sanitized project package ready for GitHub upload.

Do not explain the process.
Do not add commentary.
Produce only the packaged files.

END OF INSTRUCTIONS

---

