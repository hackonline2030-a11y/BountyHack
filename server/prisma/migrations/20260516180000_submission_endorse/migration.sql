-- Mentor advisory approval (does not validate the wizard step).
ALTER TYPE "SubmissionDecision" ADD VALUE IF NOT EXISTS 'ENDORSE';
