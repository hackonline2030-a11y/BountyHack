import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';

describe('ProgressBar', () => {
  it('should render progress bar with correct percentage for MEALS_PREVIEW', () => {
    render(<ProgressBar step={OrderingDomainModel.OrderingStep.MEALS_PREVIEW} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    expect(progressBar).toHaveAttribute('aria-valuemax', '6');
    expect(screen.getByText(/Étape 2\/6/i)).toBeInTheDocument();
  });

  it('should render correct label for TABLE step', () => {
    render(<ProgressBar step={OrderingDomainModel.OrderingStep.TABLE} />);

    expect(screen.getByText(/Choix de la table/i)).toBeInTheDocument();
  });

  it('should render correct label for RESTAURANT step', () => {
    render(<ProgressBar step={OrderingDomainModel.OrderingStep.RESTAURANT} />);

    expect(screen.getByText(/Choix du restaurant/i)).toBeInTheDocument();
    expect(screen.getByText(/Étape 1\/6/i)).toBeInTheDocument();
  });

  it('should render correct progress percentage', () => {
    const { container } = render(<ProgressBar step={OrderingDomainModel.OrderingStep.GUESTS} />);

    const progressBarFill = container.querySelector('.bg-gradient-to-r');
    // GUESTS step is step 3, so (4/6) * 100 = 66.67%
    expect(progressBarFill).toHaveStyle('width: 66.66666666666666%');
  });

  it('should handle RESERVED step correctly', () => {
    render(<ProgressBar step={OrderingDomainModel.OrderingStep.RESERVED} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '6');
    expect(screen.getByText(/Étape 6\/6/i)).toBeInTheDocument();
  });
});
