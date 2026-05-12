import React from 'react';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';

interface ProgressBarProps {
  step: OrderingDomainModel.OrderingStep;
  isQrMode?: boolean;
}

const STEP_LABELS: Record<OrderingDomainModel.OrderingStep, string> = {
  [OrderingDomainModel.OrderingStep.RESTAURANT]: 'Choix du restaurant',
  [OrderingDomainModel.OrderingStep.MEALS_PREVIEW]: 'Aperçu des plats',
  [OrderingDomainModel.OrderingStep.TABLE]: 'Choix de la table',
  [OrderingDomainModel.OrderingStep.GUESTS]: 'Vos invités',
  [OrderingDomainModel.OrderingStep.MEALS]: 'Commandes',
  [OrderingDomainModel.OrderingStep.SUMMARY]: 'Résumé',
  [OrderingDomainModel.OrderingStep.RESERVED]: 'Confirmé',
  [OrderingDomainModel.OrderingStep.QR_GUESTS]: 'Nombre de convives',
  [OrderingDomainModel.OrderingStep.EXISTING_ORDER]: 'Commande existante',
};

// QR mode has 3 steps: QR_GUESTS (1), MEALS (2), SUMMARY (3)
const QR_STEP_MAP: Partial<Record<OrderingDomainModel.OrderingStep, number>> = {
  [OrderingDomainModel.OrderingStep.QR_GUESTS]: 1,
  [OrderingDomainModel.OrderingStep.MEALS]: 2,
  [OrderingDomainModel.OrderingStep.SUMMARY]: 3,
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ step, isQrMode = false }) => {
  // QR mode: 3 steps (QR_GUESTS, MEALS, SUMMARY)
  // Normal mode: 6 steps (RESTAURANT to SUMMARY, excluding RESERVED)
  const totalSteps = isQrMode ? 3 : 6;

  let currentStep: number;
  if (isQrMode) {
    currentStep = QR_STEP_MAP[step] || 1;
  } else {
    currentStep = step >= OrderingDomainModel.OrderingStep.RESERVED ? totalSteps : step + 1;
  }

  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-6">
      <div
        className="h-1 bg-luminous-bg-secondary rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`Étape ${currentStep} sur ${totalSteps}`}
      >
        <div
          className="h-full bg-gradient-to-r from-luminous-gold to-luminous-gold-muted transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-center text-sm text-luminous-text-secondary mt-2">
        Étape {currentStep}/{totalSteps} : {STEP_LABELS[step]}
      </p>
    </div>
  );
};
