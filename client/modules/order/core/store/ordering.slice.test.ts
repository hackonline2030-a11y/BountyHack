import { orderingSlice } from './ordering.slice';
import { OrderingDomainModel } from '../model/ordering.domain-model';

describe('orderingSlice', () => {
  it('should handle setStep to MEALS_PREVIEW', () => {
    const initialState = orderingSlice.getInitialState();
    const action = orderingSlice.actions.setStep(OrderingDomainModel.OrderingStep.MEALS_PREVIEW);
    const newState = orderingSlice.reducer(initialState, action);

    expect(newState.step).toBe(OrderingDomainModel.OrderingStep.MEALS_PREVIEW);
  });
});
