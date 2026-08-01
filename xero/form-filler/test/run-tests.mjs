/**
 * Lightweight Node tests for parsers + field mapper (no Chrome APIs).
 * Run: node test/run-tests.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadScript(rel) {
  const code = fs.readFileSync(path.join(root, rel), "utf8");
  vm.runInThisContext(code, { filename: rel });
}

loadScript("lib/normalize.js");
loadScript("lib/parsers/csvParser.js");
loadScript("lib/parsers/txtParser.js");
loadScript("lib/profiles/generic.js");
loadScript("lib/profiles/xero-invoice.js");
loadScript("lib/fieldMapper.js");

const ns = globalThis.XeroFormFiller;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${msg}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${msg}`);
  }
}

console.log("CSV parser");
{
  const csv = fs.readFileSync(path.join(root, "demo/samples/invoice.csv"), "utf8");
  const res = ns.parsers.csv(csv);
  assert(res.data.contact === "Acme Consulting Ltd", "contact extracted");
  assert(res.data.invoice_number === "INV-2048", "invoice_number extracted");
  assert(res.data.total === "4950.00", "total extracted");
  assert(res.meta.layout === "key_value", "key_value layout");
}

console.log("TXT parser");
{
  const txt = fs.readFileSync(path.join(root, "demo/samples/invoice.txt"), "utf8");
  const res = ns.parsers.txt(txt);
  assert(res.data.contact === "Acme Consulting Ltd", "contact extracted");
  assert(res.data.invoice_number === "INV-2048", "invoice_number extracted");
  assert(res.data.due_date === "2026-08-14", "due_date extracted");
}

console.log("Field mapper (xero-invoice)");
{
  const csv = fs.readFileSync(path.join(root, "demo/samples/invoice.csv"), "utf8");
  const data = ns.parsers.csv(csv).data;
  const fields = [
    { fieldId: "f1", name: "contact", id: "contactName", label: "Contact", type: "text", placeholder: "", ariaLabel: "", selector: "#contactName" },
    { fieldId: "f2", name: "invoiceNumber", id: "invoiceNumber", label: "Invoice number", type: "text", placeholder: "", ariaLabel: "", selector: "#invoiceNumber" },
    { fieldId: "f3", name: "total", id: "total", label: "Total", type: "text", placeholder: "", ariaLabel: "", selector: "#total" },
    { fieldId: "f4", name: "email", id: "email", label: "Email", type: "email", placeholder: "", ariaLabel: "", selector: "#email" },
  ];
  const mapped = ns.mapFields(data, fields, { profileId: "xero-invoice", hostname: "go.xero.com" });
  assert(mapped.profile.id === "xero-invoice", "profile selected");
  assert(mapped.mappings.length >= 3, `mapped >= 3 (got ${mapped.mappings.length})`);
  const contact = mapped.mappings.find((m) => m.fieldId === "f1");
  assert(contact && contact.value.includes("Acme"), "contact mapped to f1");
}

console.log("Normalize");
{
  assert(ns.normalizeKey("Invoice #") === "invoice_number", "invoice # → invoice_number");
  assert(ns.tokenSimilarity("invoice_number", "Invoice number") > 0.9, "high similarity");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
