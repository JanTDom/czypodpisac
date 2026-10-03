import { zodToJsonSchema } from "zod-to-json-schema";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  IngestOutputSchema,
  ClassificationOutputSchema,
  SegmentationOutputSchema,
  ChecklistOutputSchema,
  RetrievalOutputSchema,
  EvaluationOutputSchema,
  ValidationOutputSchema,
  BenchmarkOutputSchema,
  AggregatedReportSchema,
  GenerationOutputSchema,
} from "../src/pipeline/schemas";

const targetDir = path.resolve(process.cwd(), "docs/schemas");
fs.mkdirSync(targetDir, { recursive: true });

const schemas = [
  { name: "stage01-ingest.json", title: "Stage 01: Ingest Output", schema: IngestOutputSchema },
  { name: "stage02-classification.json", title: "Stage 02: Classification Output", schema: ClassificationOutputSchema },
  { name: "stage03-segmentation.json", title: "Stage 03: Segmentation Output", schema: SegmentationOutputSchema },
  { name: "stage04-checklist.json", title: "Stage 04: Checklist Output", schema: ChecklistOutputSchema },
  { name: "stage05-retrieval.json", title: "Stage 05: Retrieval Output", schema: RetrievalOutputSchema },
  { name: "stage06-evaluation.json", title: "Stage 06: Evaluation Output", schema: EvaluationOutputSchema },
  { name: "stage07-validation.json", title: "Stage 07: Validation Output", schema: ValidationOutputSchema },
  { name: "stage08-benchmark.json", title: "Stage 08: Benchmark Output", schema: BenchmarkOutputSchema },
  { name: "stage09-aggregation.json", title: "Stage 09: Aggregation & Final Report", schema: AggregatedReportSchema },
  { name: "stage10-generation.json", title: "Stage 10: Generation Output", schema: GenerationOutputSchema },
];

for (const s of schemas) {
  const jsonSchema = zodToJsonSchema(s.schema, s.title);
  const filePath = path.join(targetDir, s.name);
  fs.writeFileSync(filePath, JSON.stringify(jsonSchema, null, 2), "utf-8");
  console.log(`Generated: ${filePath}`);
}

console.log("Wszystkie schematy JSON wygenerowane pomyślnie.");
