// Narzędzie diagnostyczne: wypisuje fragment oficjalnego tekstu aktu wokół podanej frazy.
// Uruchomienie: node scripts/eli-peek.mjs <ELI np. DU/2026/1245> "<fraza>" [liczba znaków]
import { fetchEliPdfText } from "./lib/eli-pdf-text.mjs";

const [eli, phrase, lengthArg] = process.argv.slice(2);
if (!eli || !phrase) {
  process.stderr.write("Użycie: node scripts/eli-peek.mjs <ELI> \"<fraza>\" [liczba znaków]\n");
  process.exit(2);
}
const text = await fetchEliPdfText(`https://api.sejm.gov.pl/eli/acts/${eli}/text.pdf`, {
  userAgent: "czypodpisac.pl legal-kb ingest",
  timeoutMs: 90000,
});
let from = 0;
let shown = 0;
while (shown < 3) {
  const i = text.indexOf(phrase, from);
  if (i === -1) break;
  process.stdout.write(`@${i}: ${text.slice(i, i + Number(lengthArg ?? 600))}\n---\n`);
  from = i + phrase.length;
  shown += 1;
}
process.stdout.write(`Długość tekstu: ${text.length}, trafień pokazanych: ${shown}\n`);
