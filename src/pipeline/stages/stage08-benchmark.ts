import { ClassificationOutput } from "../schemas/stage02-classification";
import { SegmentationOutput } from "../schemas/stage03-segmentation";
import { BenchmarkOutput, BenchmarkParamComparison } from "../schemas/stage08-benchmark";

/**
 * Próg minimalnej liczebności próby rynkowej.
 * Zgodnie ze skillem silnik-analizy (krok 10) oraz zasadą rzetelności:
 * Jeśli N < 50, bezwzględnie ustawiamy klasyfikację na 'brak_danych'
 * i nie prezentujemy żadnych niezweryfikowanych etykiet.
 */
export const MIN_STATISTICAL_SAMPLE_SIZE = 50;

/**
 * Wersja zbioru danych rynkowych. Projekt nie ma jeszcze zbioru umów ze źródłem,
 * więc etap nie zawiera żadnych wbudowanych median ani odsetków (zakaz zmyślania).
 * Porównania trafiają do raportu tylko wtedy, gdy przekaże je wywołujący
 * z udokumentowanego zbioru, i nadal obowiązuje próg N >= 50.
 */
export const BENCHMARK_DATASET_VERSION = "brak-zbioru-rynkowego";

/**
 * Etap 8: Analiza benchmarku rynkowego.
 * Bez udokumentowanego zbioru danych zwraca pustą listę porównań.
 */
export async function executeBenchmark(
  _classification: ClassificationOutput,
  _segmentation: SegmentationOutput,
  sourcedComparisons: readonly BenchmarkParamComparison[] = []
): Promise<BenchmarkOutput> {
  const comparisons: BenchmarkParamComparison[] = sourcedComparisons.map((c) => {
    const hasSufficientSample = c.sampleSize >= MIN_STATISTICAL_SAMPLE_SIZE;
    return {
      ...c,
      hasSufficientSample,
      classification: hasSufficientSample ? c.classification : "brak_danych",
      explanation: hasSufficientSample
        ? c.explanation
        : `Zbyt mała próba statystyczna (N=${c.sampleSize} < ${MIN_STATISTICAL_SAMPLE_SIZE}). Zgodnie z zasadą rzetelności czypodpisac.pl brak etykiety rynkowej.`,
    };
  });

  return {
    comparisons,
    benchmarkVersion: BENCHMARK_DATASET_VERSION,
  };
}
