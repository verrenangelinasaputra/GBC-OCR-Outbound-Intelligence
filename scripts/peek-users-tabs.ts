import fs from "node:fs";
import { google } from "googleapis";
import { loadEnvFile } from "./load-env";

loadEnvFile();

const id =
  process.env.PEEK_SHEET_ID?.trim() ||
  process.env.CREDENTIALS_SHEET_ID?.trim() ||
  "1PTxO6HbOccYn30g1l7SaGpGIcV0PBcuLmqzC3me5GYM";
const path = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH?.trim() || "./secrets/gbc-inbound-intelligence-6c70bbd0a2f7.json";
const j = JSON.parse(fs.readFileSync(path, "utf8"));
const auth = new google.auth.JWT({
  email: j.client_email,
  key: j.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

function a1(tab: string) {
  return `'${tab.replace(/'/g, "''")}'!A:N`;
}

async function main() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id, fields: "sheets.properties.title" });
  console.log("Spreadsheet", id);
  console.log("Tabs:", meta.data.sheets?.map((s) => s.properties?.title).join(", "));

  for (const tab of ["Users", "Sheet1"]) {
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: a1(tab) });
      const rows = res.data.values ?? [];
      console.log(`\n--- ${tab} (${rows.length} rows incl header) ---`);
      console.log("header:", rows[0]?.join(" | "));
      for (let i = 1; i < rows.length; i += 1) {
        const r = rows[i] ?? [];
        const uid = String(r[0] ?? "").trim();
        if (!uid) continue;
        console.log(`  ${r[2]} (@) gudang_col5=${r[5] ?? ""}`);
      }
    } catch (e) {
      console.log(tab, "error:", e instanceof Error ? e.message : e);
    }
  }
}

void main();