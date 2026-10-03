import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  IngestOutputSchema,
  ClassificationOutputSchema,
  SegmentationOutputSchema,
  ChecklistOutputSchema,
  RetrievalOutputSchema,
  EvaluationOutputSchema,
  SingleClauseEvaluationSchema,
  ValidationOutputSchema,
  GeminiVerifierOutputSchema,
  BenchmarkOutputSchema,
  AggregatedReportSchema,
  GenerationOutputSchema,
  ClauseAmendmentProposalSchema,
  NegotiationEmailDraftSchema,
} from "../src/pipeline/schemas";

const targetDir = path.resolve(process.cwd(), "docs/schemas");
fs.mkdirSync(targetDir, { recursive: true });

const schemas = [
  // 10 etapów potoku
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

  // Dedykowane schematy Structured Output dla konkretnych wywołań Gemini (Vertex AI responseSchema)
  { name: "gemini-call-01-classification.json", title: "Gemini Structured Output: Classification", schema: ClassificationOutputSchema },
  { name: "gemini-call-02-segmentation.json", title: "Gemini Structured Output: Segmentation", schema: SegmentationOutputSchema },
  { name: "gemini-call-03-evaluation.json", title: "Gemini Structured Output: Clause Evaluation", schema: SingleClauseEvaluationSchema },
  { name: "gemini-call-04-verifier.json", title: "Gemini Structured Output: Independent Verifier", schema: GeminiVerifierOutputSchema },
  { name: "gemini-call-05-amendments.json", title: "Gemini Structured Output: Amendments", schema: ClauseAmendmentProposalSchema },
  { name: "gemini-call-06-negotiation-email.json", title: "Gemini Structured Output: Negotiation Email", schema: NegotiationEmailDraftSchema },
];

for (const s of schemas) {
  const jsonSchema = z.toJSONSchema(s.schema);
  const filePath = path.join(targetDir, s.name);
  fs.writeFileSync(filePath, JSON.stringify(jsonSchema, null, 2), "utf-8");
  console.log(`Wygenerowano: ${filePath}`);
}

console.log(`Pomyślnie wyeksportowano ${schemas.length} schematów JSON.`);
