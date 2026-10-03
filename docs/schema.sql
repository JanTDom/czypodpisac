-- ==============================================================================
-- UMOWA.CHECK — SCHEMAT BAZY DANYCH POSTGRESQL Z ROW LEVEL SECURITY (RLS)
-- Region: Unia Europejska (Supabase Frankfurt / eu-central-1)
-- ==============================================================================

-- 1. WŁĄCZENIE ROZSZERZEŃ
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. TABELA ANALIZ (ANALYSES)
-- Przechowuje sesje weryfikacji umów z izolacją sesyjną i retencją 7 dni.
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    session_token_hash TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    contract_type TEXT NOT NULL DEFAULT 'unknown',
    user_role TEXT NOT NULL DEFAULT 'tenant', -- 'tenant' | 'landlord' | 'contractor' | 'client'
    party_status TEXT NOT NULL DEFAULT 'consumer', -- 'consumer' | 'consumer_entrepreneur' | 'business'
    context_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    pages_count INT NOT NULL DEFAULT 1,
    total_risk_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    verdict TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed' | 'deleted'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    deleted_at TIMESTAMPTZ
);

-- Indeksy dla tabeli analyses
CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON public.analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_analyses_session_token_hash ON public.analyses(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_expires_at ON public.analyses(expires_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_status ON public.analyses(status);

-- 3. TABELA KLAUZUL UMOWY (ANALYSIS_CLAUSES)
-- Podział umowy na jednostki ze współrzędnymi do podświetleń w interfejsie.
CREATE TABLE IF NOT EXISTS public.analysis_clauses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    clause_number TEXT NOT NULL, -- np. "§ 3 ust. 2"
    header TEXT,
    original_text TEXT NOT NULL,
    page_number INT NOT NULL DEFAULT 1,
    position_coordinates JSONB NOT NULL DEFAULT '{}'::jsonb, -- {x, y, width, height} dla podświetleń
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_clauses_analysis_id ON public.analysis_clauses(analysis_id);

-- 4. BAZA WIEDZY PRAWNEJ (LEGAL_KB_UNITS)
-- Jednostki redakcyjne z oficjalnych źródeł (ISAP, UOKiK, sądy).
CREATE TABLE IF NOT EXISTS public.legal_kb_units (
    id TEXT PRIMARY KEY, -- np. "uopl-art-6-ust-1", "kc-art-385-1"
    unit_type TEXT NOT NULL, -- 'statute' | 'uokik_clause' | 'court_ruling' | 'official_guidance'
    act_title TEXT NOT NULL,
    publication_address TEXT,
    editorial_unit TEXT NOT NULL, -- np. "art. 6 ust. 1"
    content TEXT NOT NULL,
    source_url TEXT NOT NULL,
    fetch_date DATE NOT NULL,
    legal_state_date DATE NOT NULL,
    content_hash TEXT NOT NULL, -- SHA-256
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'repealed' | 'amended'
    contract_type_tags TEXT[] NOT NULL DEFAULT '{}',
    embedding vector(768), -- dla wielojęzycznego modelu embeddingów Gemini (text-embedding-004)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_kb_units_status ON public.legal_kb_units(status);
CREATE INDEX IF NOT EXISTS idx_legal_kb_units_tags ON public.legal_kb_units USING GIN(contract_type_tags);

-- 5. CHECKLISTY KONTROLNE (CHECKLIST_ITEMS)
-- Stałe punkty weryfikacji dla typów umów.
CREATE TABLE IF NOT EXISTS public.checklist_items (
    id TEXT PRIMARY KEY, -- np. "najem-kaucja-limit"
    contract_type TEXT NOT NULL,
    area TEXT NOT NULL,
    control_question TEXT NOT NULL,
    red_criteria TEXT NOT NULL,
    yellow_criteria TEXT NOT NULL,
    green_criteria TEXT NOT NULL,
    missing_is_risk BOOLEAN NOT NULL DEFAULT false,
    benchmark_param TEXT,
    kb_source_ids TEXT[] NOT NULL DEFAULT '{}',
    uokik_clause_numbers TEXT[] NOT NULL DEFAULT '{}',
    court_ruling_signatures TEXT[] NOT NULL DEFAULT '{}',
    amendment_template_id TEXT,
    lawyer_review_status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'approved' | 'needs_update'
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_contract_type ON public.checklist_items(contract_type);
CREATE INDEX IF NOT EXISTS idx_checklist_items_status ON public.checklist_items(lawyer_review_status);

-- 6. UWAGI I WYNIKI ANALIZY (ANALYSIS_FINDINGS)
-- Konkretne wykryte ryzyka i braki weryfikowane przez etap walidacji.
CREATE TABLE IF NOT EXISTS public.analysis_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    clause_id UUID REFERENCES public.analysis_clauses(id) ON DELETE SET NULL,
    checklist_item_id TEXT REFERENCES public.checklist_items(id) ON DELETE SET NULL,
    severity TEXT NOT NULL, -- 'red' | 'yellow' | 'green' | 'missing'
    title TEXT NOT NULL,
    quote TEXT,
    plain_explanation TEXT NOT NULL,
    risk_amount NUMERIC(12, 2),
    risk_assumptions TEXT,
    kb_source_ids TEXT[] NOT NULL DEFAULT '{}',
    proposed_amendment_soft TEXT,
    proposed_amendment_firm TEXT,
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    lawyer_verification_needed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_findings_analysis_id ON public.analysis_findings(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_findings_severity ON public.analysis_findings(severity);

-- 7. SZABLONY POPRAWEK (AMENDMENT_TEMPLATES)
-- Gotowe brzmienia klauzul zatwierdzone przez radców prawnych.
CREATE TABLE IF NOT EXISTS public.amendment_templates (
    id TEXT PRIMARY KEY,
    checklist_item_id TEXT REFERENCES public.checklist_items(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    soft_text TEXT NOT NULL,
    firm_text TEXT NOT NULL,
    legal_rationale TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PŁATNOŚCI I ZAMÓWIENIA (PAYMENTS)
-- Obsługa Stripe, BLIK i Przelewy24 z weryfikacją idempotentną.
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID NOT NULL,
    provider TEXT NOT NULL DEFAULT 'stripe',
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    amount_cents INT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PLN',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'failed' | 'refunded'
    payment_method TEXT, -- 'blik' | 'p24' | 'card'
    invoice_requested BOOLEAN NOT NULL DEFAULT false,
    invoice_nip TEXT,
    invoice_company_name TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_analysis_id ON public.payments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON public.payments(stripe_session_id);

-- 9. PAKIETY I CENNIKI (PRICING_TIERS)
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id TEXT PRIMARY KEY, -- 'single_report', 'package_5', 'b2b_monthly'
    name TEXT NOT NULL,
    price_cents INT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PLN',
    active BOOLEAN NOT NULL DEFAULT true,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. OPINIE I ZWĄTPIENIA UŻYTKOWNIKÓW (ANALYSIS_FINDING_FEEDBACKS)
-- Przycisk „Nie zgadzam się” zbierający sygnały jakości dla prawników bez PII
CREATE TABLE IF NOT EXISTS public.analysis_finding_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    finding_id UUID NOT NULL REFERENCES public.analysis_findings(id) ON DELETE CASCADE,
    dispute_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_finding_id ON public.analysis_finding_feedbacks(finding_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_analysis_id ON public.analysis_finding_feedbacks(analysis_id);

-- 11. KOLEJKA ZADAŃ ASYNCHRONICZNYCH (ANALYSIS_JOBS)
-- Długie analizy jako zadania w tle z wznawianiem, retry i idempotencją
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    stage TEXT NOT NULL, -- 'ingest' | 'classification' | 'segmentation' | 'checklist' | 'retrieval' | 'evaluation' | 'validation' | 'benchmark' | 'aggregation' | 'generation'
    status TEXT NOT NULL DEFAULT 'queued', -- 'queued' | 'running' | 'completed' | 'failed' | 'retrying'
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    last_heartbeat TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled ON public.analysis_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_analysis_id ON public.analysis_jobs(analysis_id);

-- ==============================================================================
-- 12. POLITYKI BEZPIECZEŃSTWA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_finding_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_kb_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amendment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Helper SQL: weryfikacja uprawnień do analizy (zalogowany user LUB poprawny session_token_hash)
CREATE OR REPLACE FUNCTION public.can_access_analysis(target_analysis_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    req_token TEXT;
    target_hash TEXT;
    target_user UUID;
BEGIN
    -- 1. Jeśli żądanie pochodzi z klucza service_role, zezwól
    IF current_setting('role', true) = 'service_role' THEN
        RETURN true;
    END IF;

    -- Pobierz dane analizy
    SELECT session_token_hash, user_id INTO target_hash, target_user
    FROM public.analyses
    WHERE id = target_analysis_id AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- 2. Jeśli zalogowany użytkownik jest właścicielem
    IF auth.uid() IS NOT NULL AND auth.uid() = target_user THEN
        RETURN true;
    END IF;

    -- 3. Jeśli żądanie zawiera poprawny nagłówek sesji
    BEGIN
        req_token := current_setting('request.headers', true)::json->>'x-session-token';
    EXCEPTION WHEN OTHERS THEN
        req_token := NULL;
    END;

    IF req_token IS NOT NULL AND encode(digest(req_token, 'sha256'), 'hex') = target_hash THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS: ANALYSES
-- Pozwalamy anonimowemu użytkownikowi wstawić nową analizę (INSERT)
CREATE POLICY "analyses_anon_insert" ON public.analyses
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Odczyt analizy tylko przez uprawnionego właściciela lub poprawny session_token
CREATE POLICY "analyses_select_owner" ON public.analyses
    FOR SELECT TO anon, authenticated
    USING (public.can_access_analysis(id));

-- Modyfikacja analizy
CREATE POLICY "analyses_update_owner" ON public.analyses
    FOR UPDATE TO anon, authenticated
    USING (public.can_access_analysis(id))
    WITH CHECK (public.can_access_analysis(id));

-- Usunięcie analizy
CREATE POLICY "analyses_delete_owner" ON public.analyses
    FOR DELETE TO anon, authenticated
    USING (public.can_access_analysis(id));

-- RLS: ANALYSIS_CLAUSES
CREATE POLICY "clauses_select_owner" ON public.analysis_clauses
    FOR SELECT TO anon, authenticated
    USING (public.can_access_analysis(analysis_id));

CREATE POLICY "clauses_insert_service" ON public.analysis_clauses
    FOR INSERT TO service_role, anon, authenticated
    WITH CHECK (public.can_access_analysis(analysis_id));

-- RLS: ANALYSIS_FINDINGS
CREATE POLICY "findings_select_owner" ON public.analysis_findings
    FOR SELECT TO anon, authenticated
    USING (public.can_access_analysis(analysis_id));

-- RLS: ANALYSIS_FINDING_FEEDBACKS
CREATE POLICY "feedbacks_insert_owner" ON public.analysis_finding_feedbacks
    FOR INSERT TO anon, authenticated
    WITH CHECK (public.can_access_analysis(analysis_id));

CREATE POLICY "feedbacks_select_owner" ON public.analysis_finding_feedbacks
    FOR SELECT TO anon, authenticated
    USING (public.can_access_analysis(analysis_id));

-- RLS: ANALYSIS_JOBS
-- Zadania kolejki w tle: odczyt i aktualizacja stanu przez właściciela sesji lub serwer
CREATE POLICY "jobs_select_owner" ON public.analysis_jobs
    FOR SELECT TO anon, authenticated
    USING (public.can_access_analysis(analysis_id));

CREATE POLICY "jobs_manage_service" ON public.analysis_jobs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS: PAYMENTS
CREATE POLICY "payments_select_owner" ON public.payments
    FOR SELECT TO anon, authenticated
    USING (public.can_access_analysis(analysis_id));

-- RLS: PUBLIC READ-ONLY DLA WIEDZY PRAWNEJ I CENNIKA
CREATE POLICY "kb_public_select" ON public.legal_kb_units
    FOR SELECT TO anon, authenticated
    USING (status = 'active');

CREATE POLICY "checklist_public_select" ON public.checklist_items
    FOR SELECT TO anon, authenticated
    USING (lawyer_review_status = 'approved');

CREATE POLICY "amendments_public_select" ON public.amendment_templates
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

CREATE POLICY "pricing_public_select" ON public.pricing_tiers
    FOR SELECT TO anon, authenticated
    USING (active = true);

-- ==============================================================================
-- 13. AUTOMATYCZNY WORKER CZYSZCZĄCY PRZETERMINOWANE ANALIZY (7 DNI)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.purge_expired_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH to_delete AS (
        UPDATE public.analyses
        SET deleted_at = NOW(),
            status = 'deleted'
        WHERE expires_at < NOW() AND deleted_at IS NULL
        RETURNING id
    )
    SELECT count(*) INTO deleted_count FROM to_delete;

    -- Usunięcie danych powiązanych (kaskadowo)
    DELETE FROM public.analysis_clauses
    WHERE analysis_id IN (SELECT id FROM public.analyses WHERE deleted_at IS NOT NULL);

    DELETE FROM public.analysis_findings
    WHERE analysis_id IN (SELECT id FROM public.analyses WHERE deleted_at IS NOT NULL);

    DELETE FROM public.analysis_finding_feedbacks
    WHERE analysis_id IN (SELECT id FROM public.analyses WHERE deleted_at IS NOT NULL);

    DELETE FROM public.analysis_jobs
    WHERE analysis_id IN (SELECT id FROM public.analyses WHERE deleted_at IS NOT NULL);

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
