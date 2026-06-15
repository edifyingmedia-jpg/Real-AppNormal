// frontend/lib/billing/storage.ts

import fs from "fs";
import path from "path";
import type { Ledger } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "ledgers");

// Ensure directory exists
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function ledgerPath(userId: string) {
  return path.join(DATA_DIR, `${userId}.json`);
}

// ---------------------------------------------
// Load raw ledger JSON (no transformations)
// ---------------------------------------------
export function loadLedgerRaw(userId: string): Ledger | null {
  ensureDir();
  const file = ledgerPath(userId);

  if (!fs.existsSync(file)) return null;

  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load ledger:", err);
    return null;
  }
}

// ---------------------------------------------
// Save raw ledger JSON
// ---------------------------------------------
export function saveLedgerRaw(userId: string, ledger: Ledger) {
  ensureDir();
  const file = ledgerPath(userId);

  try {
    fs.writeFileSync(file, JSON.stringify(ledger, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save ledger:", err);
  }
}
