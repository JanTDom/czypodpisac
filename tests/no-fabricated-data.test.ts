import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Strażnik blokera B4: w kodzie produktu nie mogą wrócić liczby bez źródła,
 * które wcześniej były wpisane na sztywno w benchmarku i panelu admina.
 */
const FORBIDDEN = [
  "N=1420",
  "1420",
  "78% umów",
  "0,038 zł",
  "-72%",
  "1,2 sekundy",
  "2,8 sekundy",
  "99,4%",
  "pl-market-benchmark-2026.1",
  "Vertex AI UE: Online",
];

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return listFiles(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

describe("B4: brak zmyślonych danych w src/", () => {
  it("żaden plik w src/ nie zawiera usuniętych liczb bez źródła", () => {
    const hits: string[] = [];
    for (const file of listFiles(path.join(process.cwd(), "src"))) {
      const text = fs.readFileSync(file, "utf8");
      for (const needle of FORBIDDEN) {
        if (text.includes(needle)) hits.push(`${path.relative(process.cwd(), file)}: ${needle}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
