export namespace ReportDraftDomainModel {
  // ============================================================
  // Enum et 2 payloads structurés
  // ============================================================
  export enum ReportDraftStep {
    META = 0,
    DESCRIPTION = 1,
    COLLECTION = 2,
    EXPLOITATION = 3,
    PROOF_OF_CONCEPT = 4,
    RISKS = 5,
    REMEDIATION = 6,
    FINAL = 7,
  }

  /**
   * Structured payload for the META step — the bug's "identity card".
   * Mirrors the YesWeHack "Bug details" form (cf.
   * `Desktop/BugBountyApp/yesWeHackReport/steps/bug details.png`) plus the
   * standalone "Report title" field shown in the "Bug description" section
   * (`bugdescription.png`).
   *
   * `reportTitle` is the human-readable label that appears in lists
   * ("Path Traversal on /api/… via filename parameter leads to …"). Every
   * other field describes WHERE the bug lives and HOW it manifests.
   *
   * Required-fields rule lives in `MetaForm.isSubmitable` (single source
   * of truth — keep it there if you tweak which fields are mandatory).
   */
  export type MetaFields = {
    reportTitle: string;
    bugType: string;
    scopeSlug: string;
    endpoint: string;
    vulnerablePartCategory: string;
    vulnerablePartName: string;
    payload: string;
    technicalEnvironment: string;
    applicationFingerprint: string;
    cve: string;
    impact: string;
    ipsUsed: string;
  };

  /**
   * Structured payload for the DESCRIPTION step — the 8 CVSS 3.1 base
   * metrics, each stored as the single-character notation from the CVSS
   * vector spec (`AV` ∈ {N, A, L, P}, etc.).
   *
   * The CVSS vector / score / severity displayed in the UI are derived
   * from these 8 values via `cvssVector`, `cvssBaseScore`, `cvssSeverity`
   * in `core/cvss/cvss-3.1.ts` — they are never persisted.
   *
   * Required-fields rule lives in `DescriptionForm.isSubmitable`.
   */
  export type DescriptionFields = {
    attackVector: string;
    attackComplexity: string;
    privilegesRequired: string;
    userInteraction: string;
    scope: string;
    confidentiality: string;
    integrity: string;
    availability: string;
  };

  /**
   * The 6 remaining steps (COLLECTION, EXPLOITATION, PROOF_OF_CONCEPT,
   * RISKS, REMEDIATION, FINAL) use a free-form **Markdown** string as
   * payload — matching how hunters write on YesWeHack ("Styling with
   * MarkDown is supported", cf. `bugdescription.png`) and how the
   * reference PDF report is organised (prose + code blocks + embedded
   * screenshots).
   *
   * Rich content (code, lists, references to images) is expressed via
   * Markdown syntax. Binary assets live in `StepState.attachments`.
   *
   * - COLLECTION       → infos gathered before exploiting (source-code
   *                       reading, app behaviour, observations).
   * - EXPLOITATION     → reasoning about HOW the vulnerability can be
   *                       turned into a working exploit.
   * - PROOF_OF_CONCEPT → concrete reproduction steps (input params,
   *                       expected output, CTF flag if any).
   * - RISKS            → impact analysis ("what an attacker could do").
   * - REMEDIATION      → suggested fix.
   * - FINAL            → synthesis (and optional "Bug chain" sub-section
   *                       referencing related vulnerabilities).
   */

  export type ReportDraftId = string;

  // ============================================================
  // Types de workflow
  // ============================================================
  export type ReviewerRole =
    | "hunter"           // peer review entre hunters
    | "mentor"
    | "quality_checker"
    | "super_admin";

  export type StepStatus =
    | "in-progress"      // le hunter édite
    | "awaiting-review"  // soumis, en attente d'un reviewer
    | "needs-revision"   // reviewer a demandé des changements
    | "approved";        // step validé par le reviewer

  export type AggregateStatus =
    | "draft"
    | "under-review"
    | "ready-to-program"
    | "submitted-to-program"
    | "given-up"
    | "rejected";

  // ============================================================
  // Attachments (binary assets) — scoped PER step
  // ============================================================
  /**
   * Binary asset uploaded alongside a step (screenshots of the exploit,
   * short demo video, code dumps, …). Attachments live INSIDE the
   * `StepState` they belong to — a screenshot uploaded for PROOF_OF_CONCEPT
   * is invisible from COLLECTION's review surface, and vice-versa.
   *
   * Allowed mime types align with YesWeHack's policy:
   * - images : `image/jpeg`, `image/png` (≤ 10 MB)
   * - videos : `video/mp4`, `video/webm` (≤ 100 MB)
   */
  export interface Attachment {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    thumbnailUrl?: string;
    uploadedAt: string;
    uploadedBy: number;
  }

  // ============================================================
  // State machine par step
  // ============================================================
  export interface StepState<TPayload> {
    payload: TPayload;
    attachments: Attachment[];                  // assets attachés au step (peut être [])
    status: StepStatus;
    currentRound: number;                       // 0 = jamais soumis
    assignedReviewerRole: ReviewerRole | null;  // null tant que in-progress
  }

  // ============================================================
  // Agrégat racine
  // ============================================================
  export interface ReportDraft {
    id: ReportDraftId;
    hunterId: number;                  // user id du propriétaire
    version: number;                   // optimistic-lock
    aggregateStatus: AggregateStatus;
    meta: StepState<MetaFields>;
    description: StepState<DescriptionFields>;
    collection: StepState<string>;
    exploitation: StepState<string>;
    proofOfConcept: StepState<string>;
    risks: StepState<string>;
    remediation: StepState<string>;
    final: StepState<string>;
    createdAt: string;
    updatedAt: string;
    // TODO V2 (dette consciente) : terminationReason / terminatedBy /
    // terminatedByRole / terminatedAt pour audit des given-up et rejected
  }

  // ============================================================
  // Entité immuable d'historique
  // ============================================================
  export interface Submission<TPayload> {
    id: string;                                          // uuid/uuidv7 via IIdProvider
    reportDraftId: ReportDraftId;
    step: ReportDraftStep;
    round: number;                                       // 1, 2, 3, …
    payload: TPayload;                                   // SNAPSHOT immuable
    attachmentsSnapshot: Attachment[];                   // SNAPSHOT immuable des assets attachés au moment de la soumission
    submittedAt: string;
    submittedBy: number;                                 // hunter user id
    reviewerRole: ReviewerRole;
    decision: "pending" | "approve" | "request-changes";
    decidedAt?: string;
    decidedBy?: number;
  }

  // ============================================================
  // Comment ancré sur une Submission
  // ============================================================
  export interface ReviewerComment {
    id: string;                                        // uuid/uuidv7 via IIdProvider
    submissionId: string;                              // FK Submission, pas ReportDraft
    authorId: number;
    authorRole: ReviewerRole;
    anchor?: {
      field: string;
      lineStart?: number;
      lineEnd?: number;
      attachmentId?: string;                             // commentaire ancré sur une image/vidéo précise
    };
    body: string;
    createdAt: string;
    resolvedAt?: string;
  }
}