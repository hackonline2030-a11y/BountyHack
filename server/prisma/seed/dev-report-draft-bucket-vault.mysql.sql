-- =============================================================================
-- DEV SEED — cycle report-draft autonome (MySQL)
-- =============================================================================
-- Non destructif : aucun DELETE, aucun écrasement de lignes existantes.
-- Ré-exécution sûre : INSERT IGNORE / INSERT … WHERE NOT EXISTS uniquement.
--
-- Exécution (depuis bugbountyapp/server/) :
--   Docker (recommandé) : pnpm docker:mysql:up && pnpm docker:prisma:seed:dev-draft
--   Hôte (MySQL sur localhost:3306) : pnpm prisma:seed:dev-draft
--
-- Comptes créés (mot de passe = même hash que le compte démo `demo-user` du seed standard) :
--   dev-sa-1@example.local      (SUPER_ADMIN)
--   dev-sa-2@example.local      (SUPER_ADMIN)
--   dev-hunter-1@example.local  (HUNTER — propriétaire du brouillon)
--   dev-hunter-2@example.local  (HUNTER)
--   dev-qc-1@example.local      (QUALITY_CHECKER)
--   dev-qc-2@example.local      (QUALITY_CHECKER)
--   dev-mentor-1@example.local  (MENTOR)
--   dev-coordinator@example.local (COORDINATOR)
--
-- État final du brouillon :
--   • Soumissions QC par étape + commentaires
--   • 2 révisions globales (QC+SA), count = 2
--   • SUBMITTED_TO_PROGRAM + report PENDING lié (`pending_report_id`)
-- =============================================================================

-- Aligné sur les migrations Prisma (utf8mb4_unicode_ci), pas le défaut MySQL 8.4 (0900_ai_ci).
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── Mot de passe partagé (hash du seed demo-user) ───────────────────────────
SET @dev_password_hash = 'f764cb4e98d68cc8eae3a76a679371d7:7dc132dc78ad1dffa69d9613e37653a31efb152c72e1d618884e35e965b0d34ab57edde9d70721d9dcaa2e4309d39f358699015bb6ae90b6d831f8b65c5758f9';

-- ── Utilisateurs dev (namespace cccccccc) ───────────────────────────────────
SET @sa1_id      = 'cccccccc-0001-4000-8000-000000000001';
SET @sa2_id      = 'cccccccc-0002-4000-8000-000000000002';
SET @hunter1_id  = 'cccccccc-0010-4000-8000-000000000001';
SET @hunter2_id  = 'cccccccc-0011-4000-8000-000000000001';
SET @qc1_id      = 'cccccccc-0020-4000-8000-000000000001';
SET @qc2_id      = 'cccccccc-0021-4000-8000-000000000001';
SET @mentor1_id  = 'cccccccc-0030-4000-8000-000000000001';
SET @coord_id    = 'cccccccc-0040-4000-8000-000000000001';

-- ── Brouillon / report / équipe (namespace bbbbbbbb) ────────────────────────
SET @draft_id   = 'bbbbbbbb-0001-4000-8000-000000000001';
SET @report_id  = 'bbbbbbbb-0002-4000-8000-000000000001';
SET @team_id    = 'bbbbbbbb-0003-4000-8000-000000000001';

SET @step_meta  = 'bbbbbbbb-0010-4000-8000-000000000001';
SET @step_desc  = 'bbbbbbbb-0011-4000-8000-000000000001';
SET @step_coll  = 'bbbbbbbb-0012-4000-8000-000000000001';
SET @step_expl  = 'bbbbbbbb-0013-4000-8000-000000000001';
SET @step_poc   = 'bbbbbbbb-0014-4000-8000-000000000001';
SET @step_risk  = 'bbbbbbbb-0015-4000-8000-000000000001';
SET @step_remed = 'bbbbbbbb-0016-4000-8000-000000000001';
SET @step_final = 'bbbbbbbb-0017-4000-8000-000000000001';

SET @sub_meta_r1    = 'bbbbbbbb-0201-4000-8000-000000000001';
SET @sub_desc_r1    = 'bbbbbbbb-0202-4000-8000-000000000001';
SET @sub_coll_r1    = 'bbbbbbbb-0203-4000-8000-000000000001';
SET @sub_expl_r1    = 'bbbbbbbb-0204-4000-8000-000000000001';
SET @sub_expl_r2    = 'bbbbbbbb-0205-4000-8000-000000000001';
SET @sub_poc_r1     = 'bbbbbbbb-0206-4000-8000-000000000001';
SET @sub_risk_r1    = 'bbbbbbbb-0207-4000-8000-000000000001';
SET @sub_remed_r1   = 'bbbbbbbb-0208-4000-8000-000000000001';
SET @sub_final_r1   = 'bbbbbbbb-0209-4000-8000-000000000001';
SET @sub_meta_sa_r1 = 'bbbbbbbb-0210-4000-8000-000000000001';

SET @com_meta_qc    = 'bbbbbbbb-0301-4000-8000-000000000001';
SET @com_coll_qc    = 'bbbbbbbb-0302-4000-8000-000000000001';
SET @com_expl_qc    = 'bbbbbbbb-0303-4000-8000-000000000001';
SET @com_meta_sa    = 'bbbbbbbb-0304-4000-8000-000000000001';

SET @gs_qc_rev1     = 'bbbbbbbb-0401-4000-8000-000000000001';
SET @gs_sa_rev1     = 'bbbbbbbb-0402-4000-8000-000000000001';
SET @gs_qc_rev2     = 'bbbbbbbb-0403-4000-8000-000000000001';
SET @gs_sa_rev2     = 'bbbbbbbb-0404-4000-8000-000000000001';
SET @gcom_qc_rev1   = 'bbbbbbbb-0501-4000-8000-000000000001';

SET @t0 = '2026-05-17 13:26:15.306';
SET @t1 = '2026-05-17 13:29:16.038';
SET @t2 = '2026-05-17 18:25:16.990';
SET @t3 = '2026-05-17 18:26:26.281';
SET @t4 = '2026-05-17 20:38:34.092';
SET @t5 = '2026-05-17 20:56:25.336';
SET @t6 = '2026-05-17 20:56:57.132';
SET @t7 = '2026-05-17 21:08:25.731';

-- ── Rôles applicatifs — uniquement si l’id n’existe pas encore ──────────────
INSERT IGNORE INTO `roles` (`id`, `name`) VALUES
  (1, 'USER'),
  (2, 'SUPER_ADMIN'),
  (3, 'HUNTER'),
  (4, 'MENTOR'),
  (5, 'QUALITY_CHECKER'),
  (6, 'COORDINATOR'),
  (7, 'QUALITY_CONTENT');

-- ── Utilisateurs dev — uniquement si l’id n’existe pas (pas de mise à jour) ───
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password_hash`, `two_factor_enabled`, `role_id`) VALUES
  (@sa1_id,     'dev-sa-1',     'dev-sa-1@example.local',     @dev_password_hash, 0, 2),
  (@sa2_id,     'dev-sa-2',     'dev-sa-2@example.local',     @dev_password_hash, 0, 2),
  (@hunter1_id, 'dev-hunter-1', 'dev-hunter-1@example.local', @dev_password_hash, 0, 3),
  (@hunter2_id, 'dev-hunter-2', 'dev-hunter-2@example.local', @dev_password_hash, 0, 3),
  (@qc1_id,     'dev-qc-1',     'dev-qc-1@example.local',     @dev_password_hash, 0, 5),
  (@qc2_id,     'dev-qc-2',     'dev-qc-2@example.local',     @dev_password_hash, 0, 5),
  (@mentor1_id, 'dev-mentor-1', 'dev-mentor-1@example.local', @dev_password_hash, 0, 4),
  (@coord_id,   'dev-coordinator', 'dev-coordinator@example.local', @dev_password_hash, 0, 6);

SELECT CASE
  WHEN EXISTS (SELECT 1 FROM `report_drafts` WHERE `id` = @draft_id) THEN
    'SKIP — cycle dev déjà présent (aucune écriture sur report_drafts / reports)'
  ELSE
    'RUN — création du cycle dev report-draft'
END AS seed_workflow_guard;

-- ── Payloads (colonnes JSON des étapes — alignés Adminer / code actuel) ─────
-- META : champs plats (pas de sectionBlocs)
SET @payload_meta = CAST('{
  "cve": "CVE 2026-09608",
  "impact": "Access unauthorized of http",
  "bugType": "CWE-89",
  "ipsUsed": "203.67.78.9",
  "payload": "public",
  "endpoint": "GET /?action=generate&filename=myfilename&signature=",
  "scopeSlug": "dojo-50",
  "reportTitle": "Rapport challenge n°50",
  "vulnerablePartName": "mysecret.txt",
  "technicalEnvironment": "Burp Suite, IA superdynamic",
  "applicationFingerprint": "NodeJs - NestJs",
  "vulnerablePartCategory": "GET_PARAMETER"
}' AS JSON);

-- DESCRIPTION : métriques CVSS + sectionBlocs (vide par défaut côté app)
SET @payload_desc = CAST('{
  "scope": "U",
  "integrity": "N",
  "attackVector": "N",
  "availability": "N",
  "confidentiality": "L",
  "userInteraction": "R",
  "attackComplexity": "L",
  "privilegesRequired": "N",
  "sectionBlocs": []
}' AS JSON);

-- Étapes long-form : uniquement { "sectionBlocs": [...] }
SET @payload_coll = CAST('{
  "sectionBlocs": [{
    "id": "546a4a3f-8572-4bb0-ac45-645a5034a269",
    "body": "Blabalabla",
    "lists": [],
    "heading": "",
    "subheading": "",
    "attachmentId": null,
    "headingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"},
    "subheadingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"}
  }]
}' AS JSON);

SET @payload_expl = CAST('{
  "sectionBlocs": [{
    "id": "81ca702c-f341-480e-8070-afa9b7da4b79",
    "body": "blabla 2",
    "lists": [],
    "heading": "",
    "subheading": "",
    "attachmentId": null,
    "headingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"},
    "subheadingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"}
  }]
}' AS JSON);

SET @payload_poc = CAST('{
  "sectionBlocs": [{
    "id": "3f476b48-0d56-4084-ab2d-bf3d09f53802",
    "body": "blabla 3",
    "lists": [],
    "heading": "",
    "subheading": "",
    "attachmentId": null,
    "headingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"},
    "subheadingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"}
  }]
}' AS JSON);

SET @payload_risk = CAST('{
  "sectionBlocs": [{
    "id": "c0c0a48e-ab8e-42b3-84c7-1c39eefd00bb",
    "body": "risque ",
    "lists": [],
    "heading": "",
    "subheading": "",
    "attachmentId": null,
    "headingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"},
    "subheadingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"}
  }]
}' AS JSON);

SET @payload_remed = CAST('{
  "sectionBlocs": [{
    "id": "84baec0a-b0d2-4934-bad6-1135f6942cdd",
    "body": "nous remedions",
    "lists": [],
    "heading": "",
    "subheading": "",
    "attachmentId": null,
    "headingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"},
    "subheadingFormat": {"color": "#1e293b", "style": "normal", "fontSize": "medium"}
  }]
}' AS JSON);

SET @payload_final = CAST('{"sectionBlocs": []}' AS JSON);

-- ── Brouillon (sauté si @draft_id existe déjà) ─────────────────────────────────
INSERT INTO `report_drafts` (
  `id`, `hunter_id`, `version`, `aggregate_status`,
  `super_admin_revision_requested_at`, `super_admin_global_revision_count`,
  `pending_report_id`, `created_at`, `updated_at`
)
SELECT
  @draft_id, @hunter1_id, 36, 'SUBMITTED_TO_PROGRAM',
  NULL, 2,
  NULL, @t0, @t7
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `report_drafts` WHERE `id` = @draft_id);

INSERT INTO `report_draft_steps` (
  `id`, `report_draft_id`, `step`, `payload`, `status`, `current_round`,
  `assigned_reviewer_role`, `created_at`, `updated_at`
)
SELECT @step_meta, @draft_id, 'META', @payload_meta, 'APPROVED', 2, NULL, @t0, @t7 FROM DUAL
WHERE EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  )
  AND NOT EXISTS (SELECT 1 FROM `report_draft_steps` WHERE `id` = @step_meta)
UNION ALL SELECT @step_desc, @draft_id, 'DESCRIPTION', @payload_desc, 'APPROVED', 2, NULL, @t0, @t7 FROM DUAL
WHERE EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  )
  AND NOT EXISTS (SELECT 1 FROM `report_draft_steps` WHERE `id` = @step_desc)
UNION ALL SELECT @step_coll, @draft_id, 'COLLECTION', @payload_coll, 'APPROVED', 2, NULL, @t0, @t7 FROM DUAL
WHERE EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  )
  AND NOT EXISTS (SELECT 1 FROM `report_draft_steps` WHERE `id` = @step_coll)
UNION ALL SELECT @step_expl, @draft_id, 'EXPLOITATION', @payload_expl, 'APPROVED', 2, NULL, @t0, @t7 FROM DUAL
WHERE EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  )
  AND NOT EXISTS (SELECT 1 FROM `report_draft_steps` WHERE `id` = @step_expl)
UNION ALL SELECT @step_poc, @draft_id, 'PROOF_OF_CONCEPT', @payload_poc, 'APPROVED', 2, NULL, @t0, @t7 FROM DUAL
WHERE EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  )
  AND NOT EXISTS (SELECT 1 FROM `report_draft_steps` WHERE `id` = @step_poc)
UNION ALL SELECT @step_risk, @draft_id, 'RISKS', @payload_risk, 'APPROVED', 2, NULL, @t0, @t7 FROM DUAL
WHERE EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  )
  AND NOT EXISTS (SELECT 1 FROM `report_draft_steps` WHERE `id` = @step_risk)
UNION ALL SELECT @step_remed, @draft_id, 'REMEDIATION', @payload_remed, 'APPROVED', 2, NULL, @t0, @t7 FROM DUAL
WHERE EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  )
  AND NOT EXISTS (SELECT 1 FROM `report_draft_steps` WHERE `id` = @step_remed)
UNION ALL SELECT @step_final, @draft_id, 'FINAL', @payload_final, 'APPROVED', 2, NULL, @t0, @t7 FROM DUAL
WHERE EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  )
  AND NOT EXISTS (SELECT 1 FROM `report_draft_steps` WHERE `id` = @step_final);

-- ── Équipe ────────────────────────────────────────────────────────────────────
INSERT INTO `report_draft_teams` (`id`, `report_draft_id`, `label`, `created_at`, `updated_at`)
SELECT @team_id, @draft_id, 'Rapport SQL Injection (dev seed)', @t0, @t7 FROM DUAL
WHERE EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  )
  AND NOT EXISTS (SELECT 1 FROM `report_draft_teams` WHERE `id` = @team_id);

INSERT INTO `report_team_members` (`id`, `team_id`, `user_id`, `role`, `joined_at`)
SELECT 'bbbbbbbb-0031-4000-8000-000000000001', @team_id, @hunter1_id, 'HUNTER', @t0 FROM DUAL
WHERE EXISTS (SELECT 1 FROM `report_draft_teams` WHERE `id` = @team_id)
  AND NOT EXISTS (SELECT 1 FROM `report_team_members` WHERE `id` = 'bbbbbbbb-0031-4000-8000-000000000001')
UNION ALL SELECT 'bbbbbbbb-0032-4000-8000-000000000001', @team_id, @qc1_id, 'QUALITY_CHECKER', @t0 FROM DUAL
WHERE EXISTS (SELECT 1 FROM `report_draft_teams` WHERE `id` = @team_id)
  AND NOT EXISTS (SELECT 1 FROM `report_team_members` WHERE `id` = 'bbbbbbbb-0032-4000-8000-000000000001')
UNION ALL SELECT 'bbbbbbbb-0033-4000-8000-000000000001', @team_id, @mentor1_id, 'MENTOR', @t0 FROM DUAL
WHERE EXISTS (SELECT 1 FROM `report_draft_teams` WHERE `id` = @team_id)
  AND NOT EXISTS (SELECT 1 FROM `report_team_members` WHERE `id` = 'bbbbbbbb-0033-4000-8000-000000000001')
UNION ALL SELECT 'bbbbbbbb-0034-4000-8000-000000000001', @team_id, @hunter2_id, 'HUNTER', @t0 FROM DUAL
WHERE EXISTS (SELECT 1 FROM `report_draft_teams` WHERE `id` = @team_id)
  AND NOT EXISTS (SELECT 1 FROM `report_team_members` WHERE `id` = 'bbbbbbbb-0034-4000-8000-000000000001');

-- ── Soumissions par étape (QC + 1 piste SA sur META) ─────────────────────────
INSERT IGNORE INTO `submissions` (
  `id`, `report_draft_step_id`, `report_draft_id`, `step`, `round`,
  `submission_kind`, `payload`, `submitted_at`, `submitted_by`,
  `reviewer_role`, `decision`, `decided_at`, `decided_by`
) VALUES
  (@sub_meta_r1,    @step_meta,  @draft_id, 'META',             1, 'HUNTER_TO_REVIEWER', @payload_meta,  @t1, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE',         @t2, @qc1_id),
  (@sub_desc_r1,    @step_desc,  @draft_id, 'DESCRIPTION',      1, 'HUNTER_TO_REVIEWER', @payload_desc,  @t1, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE',         @t2, @qc1_id),
  (@sub_coll_r1,    @step_coll,  @draft_id, 'COLLECTION',       1, 'HUNTER_TO_REVIEWER', @payload_coll,  @t2, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE',         @t3, @qc1_id),
  (@sub_expl_r1,    @step_expl,  @draft_id, 'EXPLOITATION',     1, 'HUNTER_TO_REVIEWER', @payload_expl,  @t2, @hunter1_id, 'QUALITY_CHECKER', 'REQUEST_CHANGES', @t3, @qc1_id),
  (@sub_expl_r2,    @step_expl,  @draft_id, 'EXPLOITATION',     2, 'HUNTER_TO_REVIEWER', @payload_expl,  @t3, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE',         @t4, @qc1_id),
  (@sub_poc_r1,     @step_poc,   @draft_id, 'PROOF_OF_CONCEPT', 1, 'HUNTER_TO_REVIEWER', @payload_poc,   @t3, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE',         @t4, @qc1_id),
  (@sub_risk_r1,    @step_risk,  @draft_id, 'RISKS',            1, 'HUNTER_TO_REVIEWER', @payload_risk,  @t3, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE',         @t4, @qc1_id),
  (@sub_remed_r1,   @step_remed, @draft_id, 'REMEDIATION',      1, 'HUNTER_TO_REVIEWER', @payload_remed, @t3, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE',         @t4, @qc1_id),
  (@sub_final_r1,   @step_final, @draft_id, 'FINAL',            1, 'HUNTER_TO_REVIEWER', @payload_final, @t4, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE',         @t5, @qc1_id),
  (@sub_meta_sa_r1, @step_meta,  @draft_id, 'META',             3, 'HUNTER_TO_REVIEWER', @payload_meta,  @t5, @sa1_id,     'SUPER_ADMIN',     'PENDING',         NULL, NULL);

INSERT IGNORE INTO `reviewer_comments` (
  `id`, `submission_id`, `author_id`, `author_role`, `anchor`, `body`, `created_at`
) VALUES
  (@com_meta_qc, @sub_meta_r1, @qc1_id, 'QUALITY_CHECKER',
   CAST('{"field":"__general__"}' AS JSON),
   'Métadonnées OK pour la revue QC.', @t2),
  (@com_coll_qc, @sub_coll_r1, @qc1_id, 'QUALITY_CHECKER',
   CAST('{"field":"sectionBlocs.546a4a3f-8572-4bb0-ac45-645a5034a269.body"}' AS JSON),
   'Détailler la collecte (capture en V2).', @t3),
  (@com_expl_qc, @sub_expl_r1, @qc1_id, 'QUALITY_CHECKER',
   CAST('{"field":"__general__"}' AS JSON),
   'Relier exploitation et PoC.', @t3),
  (@com_meta_sa, @sub_meta_sa_r1, @sa1_id, 'SUPER_ADMIN',
   CAST('{"field":"__general__"}' AS JSON),
   'Commentaire SA sur métadonnées (validation finale).', @t5);

-- ── Snapshot global (8 StepStateWire — statuts wire en minuscules) ────────────
SET @step_state_meta = JSON_OBJECT(
  'payload', @payload_meta,
  'attachments', JSON_ARRAY(),
  'status', 'approved',
  'currentRound', 2,
  'assignedReviewerRole', NULL
);
SET @step_state_desc = JSON_OBJECT(
  'payload', @payload_desc,
  'attachments', JSON_ARRAY(),
  'status', 'approved',
  'currentRound', 2,
  'assignedReviewerRole', NULL
);
SET @step_state_coll = JSON_OBJECT(
  'payload', @payload_coll,
  'attachments', JSON_ARRAY(),
  'status', 'approved',
  'currentRound', 2,
  'assignedReviewerRole', NULL
);
SET @step_state_expl = JSON_OBJECT(
  'payload', @payload_expl,
  'attachments', JSON_ARRAY(),
  'status', 'approved',
  'currentRound', 2,
  'assignedReviewerRole', NULL
);
SET @step_state_poc = JSON_OBJECT(
  'payload', @payload_poc,
  'attachments', JSON_ARRAY(),
  'status', 'approved',
  'currentRound', 2,
  'assignedReviewerRole', NULL
);
SET @step_state_risk = JSON_OBJECT(
  'payload', @payload_risk,
  'attachments', JSON_ARRAY(),
  'status', 'approved',
  'currentRound', 2,
  'assignedReviewerRole', NULL
);
SET @step_state_remed = JSON_OBJECT(
  'payload', @payload_remed,
  'attachments', JSON_ARRAY(),
  'status', 'approved',
  'currentRound', 2,
  'assignedReviewerRole', NULL
);
SET @step_state_final = JSON_OBJECT(
  'payload', @payload_final,
  'attachments', JSON_ARRAY(),
  'status', 'approved',
  'currentRound', 2,
  'assignedReviewerRole', NULL
);

SET @global_snapshot = JSON_OBJECT(
  'meta', @step_state_meta,
  'description', @step_state_desc,
  'collection', @step_state_coll,
  'exploitation', @step_state_expl,
  'proofOfConcept', @step_state_poc,
  'risks', @step_state_risk,
  'remediation', @step_state_remed,
  'final', @step_state_final
);

-- Révision globale 1 : QC + SA approuvent (historique, comme Adminer)
INSERT IGNORE INTO `global_submissions` (
  `id`, `report_draft_id`, `revision_number`, `payload`,
  `submitted_at`, `submitted_by`, `reviewer_role`, `decision`, `decided_at`, `decided_by`
) VALUES
  (@gs_qc_rev1, @draft_id, 1, @global_snapshot, @t4, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE', @t5, @qc1_id),
  (@gs_sa_rev1, @draft_id, 1, @global_snapshot, @t4, @hunter1_id, 'SUPER_ADMIN',     'APPROVE', @t5, @sa1_id);

-- Révision globale 2 : QC approuvé, SA encore PENDING (comme session Adminer)
INSERT IGNORE INTO `global_submissions` (
  `id`, `report_draft_id`, `revision_number`, `payload`,
  `submitted_at`, `submitted_by`, `reviewer_role`, `decision`, `decided_at`, `decided_by`
) VALUES
  (@gs_qc_rev2, @draft_id, 2, @global_snapshot, @t5, @hunter1_id, 'QUALITY_CHECKER', 'APPROVE', @t6, @qc1_id),
  (@gs_sa_rev2, @draft_id, 2, @global_snapshot, @t5, @hunter1_id, 'SUPER_ADMIN',     'PENDING', NULL, NULL);

INSERT IGNORE INTO `global_reviewer_comments` (
  `id`, `global_submission_id`, `author_id`, `author_role`, `anchor`, `body`, `created_at`
) VALUES (
  @gcom_qc_rev1, @gs_qc_rev1, @qc1_id, 'QUALITY_CHECKER',
  CAST('{"field":"__general__"}' AS JSON),
  'Harmoniser les sections avant clôture globale.',
  @t5
);

-- ── Report PENDING (ce qui manquait dans ton dump Adminer) ────────────────────
SET @frozen_content = JSON_OBJECT(
  'schemaVersion', 1,
  'sourceDraftId', @draft_id,
  'draftVersion', 36,
  'hunterId', @hunter1_id,
  'frozenAt', '2026-05-17T21:08:25.731Z',
  'reportTeam', JSON_OBJECT(
    'label', 'Rapport SQL Injection (dev seed)',
    'members', JSON_ARRAY(
      JSON_OBJECT('userId', @hunter1_id, 'displayName', 'dev-hunter-1', 'role', 'hunter'),
      JSON_OBJECT('userId', @qc1_id, 'displayName', 'dev-qc-1', 'role', 'quality_checker'),
      JSON_OBJECT('userId', @mentor1_id, 'displayName', 'dev-mentor-1', 'role', 'mentor'),
      JSON_OBJECT('userId', @hunter2_id, 'displayName', 'dev-hunter-2', 'role', 'hunter')
    )
  ),
  'steps', @global_snapshot
);

INSERT INTO `reports` (
  `id`, `hunter_id`, `source_draft_id`, `status`, `frozen_content`,
  `content_synced_at`, `promoted_by`, `created_at`, `updated_at`
)
SELECT
  @report_id, @hunter1_id, @draft_id, 'PENDING', @frozen_content,
  @t7, @sa1_id, @t7, @t7
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `reports` WHERE `id` = @report_id)
  AND EXISTS (
    SELECT 1 FROM `report_drafts`
    WHERE `id` = @draft_id AND `hunter_id` = @hunter1_id
  );

-- Compléter le lien draft → report uniquement si encore vide (ne remplace jamais un id existant)
UPDATE `report_drafts`
SET `pending_report_id` = @report_id,
    `updated_at` = @t7
WHERE `id` = @draft_id
  AND `hunter_id` = @hunter1_id
  AND (`pending_report_id` IS NULL OR `pending_report_id` = @report_id)
  AND EXISTS (SELECT 1 FROM `reports` WHERE `id` = @report_id);

-- Repair dev report if an older row exists without nested `steps` (PDF mapper expects it).
UPDATE `reports`
SET `frozen_content` = @frozen_content,
    `updated_at` = @t7
WHERE `id` = @report_id
  AND JSON_EXTRACT(`frozen_content`, '$.steps') IS NULL;

SELECT 'dev-report-draft-bucket-vault' AS seed,
  @draft_id AS report_draft_id,
  @report_id AS pending_report_id,
  @hunter1_id AS hunter_id,
  @sa1_id AS super_admin_primary,
  'SUBMITTED_TO_PROGRAM' AS aggregate_status;
