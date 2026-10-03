import {
  ClassificationInput,
  ClassificationOutput,
  ContractType,
  UserRole,
  PartyStatus,
  ContextQuestion,
} from "../schemas/stage02-classification";

/**
 * Etap 2: Klasyfikacja umowy, stron i ról
 * Rozpoznaje typ umowy, strony, rolę użytkownika, status konsumenta oraz kluczowe finanse.
 * Zgodnie z regułą 01: pyta maksymalnie o 2 rzeczy tylko wtedy, gdy odpowiedź zmienia ocenę.
 */
export async function executeClassification(
  input: ClassificationInput
): Promise<ClassificationOutput> {
  const text = input.fullText.toLowerCase();

  let contractType: ContractType = "inna_nieznana";
  let userRole: UserRole = "najemca";
  let partyStatus: PartyStatus = "consumer";
  let confidence = 0.5;

  // 1. Rozpoznanie typu umowy na podstawie słów kluczowych i tytułu
  if (text.includes("najem okazjonalny") || text.includes("najmu okazjonalnego") || text.includes("art. 19a")) {
    contractType = "najem_okazjonalny";
    userRole = "najemca";
    confidence = 0.98;
  } else if (text.includes("najem instytucjonalny") || text.includes("najmu instytucjonalnego") || text.includes("art. 19f")) {
    contractType = "najem_instytucjonalny";
    userRole = "najemca";
    confidence = 0.98;
  } else if (text.includes("lokalu użytkowego") || text.includes("najmu komercyjnego") || text.includes("na cele prowadzenia działalności gospodarczej")) {
    contractType = "najem_lokalu_uzytkowego";
    userRole = "najemca";
    partyStatus = "business";
    confidence = 0.95;
  } else if (text.includes("najmu") || text.includes("wynajmujący") || text.includes("najemca") || text.includes("lokal mieszkalny")) {
    contractType = "najem_lokalu_mieszkalnego";
    userRole = "najemca";
    confidence = 0.95;
  } else if (text.includes("o dzieło") || text.includes("zamawiający") && text.includes("przyjmujący zamówienie")) {
    contractType = "dzielo";
    userRole = "wykonawca";
    confidence = 0.9;
  } else if (text.includes("zlecenia") || text.includes("zleceniodawca") && text.includes("zleceniobiorca")) {
    contractType = "zlecenie";
    userRole = "wykonawca";
    confidence = 0.9;
  } else if (text.includes("o pracę") || text.includes("pracodawca") && text.includes("pracownik")) {
    contractType = "umowa_o_prace";
    userRole = "pracownik";
    confidence = 0.95;
  } else if (text.includes("deweloperska") || text.includes("nabywca") && text.includes("deweloper")) {
    contractType = "umowa_deweloperska";
    userRole = "nabywca";
    confidence = 0.95;
  }

  // 2. Uwzględnienie ewentualnych odpowiedzi użytkownika
  if (input.userProvidedAnswers) {
    if (input.userProvidedAnswers.userRole) {
      userRole = input.userProvidedAnswers.userRole as UserRole;
    }
    if (input.userProvidedAnswers.partyStatus) {
      partyStatus = input.userProvidedAnswers.partyStatus as PartyStatus;
    }
  }

  // 3. Wykrycie kwot finansowych (czynsz, kaucja)
  let rentAmount: number | undefined;
  let depositAmount: number | undefined;

  // Przeszukiwanie wzorców: "czynsz w kwocie 3500 zł", "3 000 PLN"
  const rentMatch = text.match(/(?:czynsz(?:u|em)?|wynagrodzeni(?:e|a))\s*(?:w wysokości|w kwocie|wynosi)?\s*([0-9\s]+(?:[,\.][0-9]{2})?)\s*(?:zł|pln)/i);
  if (rentMatch) {
    const rawVal = rentMatch[1].replace(/\s+/g, "").replace(",", ".");
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed > 0) rentAmount = parsed;
  }

  const depositMatch = text.match(/(?:kaucj(?:a|i|ę))\s*(?:w wysokości|w kwocie|wynosi)?\s*([0-9\s]+(?:[,\.][0-9]{2})?)\s*(?:zł|pln)/i);
  if (depositMatch) {
    const rawVal = depositMatch[1].replace(/\s+/g, "").replace(",", ".");
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed > 0) depositAmount = parsed;
  }

  // 4. Pytania kontekstowe (maksymalnie 2) tylko jeśli pewność < 0.85 lub nie podano w odpowiedziach
  const clarificationQuestions: ContextQuestion[] = [];
  let needsUserClarification = false;

  if (!input.userProvidedAnswers?.userRole && confidence < 0.9) {
    needsUserClarification = true;
    clarificationQuestions.push({
      id: "q-user-role",
      question: "Którą stroną umowy jesteś?",
      description: "Ocena ryzyka zależy od tego, czy jesteś stroną zobowiązaną do zapłaty, czy wykonawcą/wynajmującym.",
      options: [
        { value: "najemca", label: "Najemca (wynajmuję mieszkanie dla siebie)" },
        { value: "wynajmujacy", label: "Wynajmujący (jestem właścicielem mieszkania)" },
      ],
    });
  }

  if (!input.userProvidedAnswers?.partyStatus && clarificationQuestions.length < 2 && confidence < 0.9) {
    clarificationQuestions.push({
      id: "q-party-status",
      question: "W jakim charakterze podpisujesz umowę?",
      description: "Konsumentom przysługuje szczególna ochrona przed klauzulami niedozwolonymi.",
      options: [
        { value: "consumer", label: "Osoba prywatna (konsument)" },
        { value: "business", label: "Firma (działalność gospodarcza / spółka)" },
      ],
    });
  }

  return {
    contractType,
    userRole,
    partyStatus,
    confidence,
    needsUserClarification: clarificationQuestions.length > 0 && !input.userProvidedAnswers,
    clarificationQuestions: clarificationQuestions.slice(0, 2),
    detectedParties: [
      { role: "Druga strona", isIdentifiedAsConsumer: false },
      { role: userRole, isIdentifiedAsConsumer: partyStatus === "consumer" },
    ],
    detectedFinancials: {
      rentAmount,
      depositAmount,
      currency: "PLN",
    },
  };
}
