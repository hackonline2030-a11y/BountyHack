import { DemoMealGateway } from '@taotask/modules/order/core/gateway-infra/demo.meal-gateway';
import { DemoMealsStore } from '@taotask/modules/shared/demo/demo-meals.store';
import { IMealGateway } from '@taotask/modules/order/core/gateway/meal.gateway';
import { AppState } from '@taotask/modules/store/store';

const createState = (restaurantId: string | number | null): AppState =>
  ({
    ordering: {
      restaurantId,
    },
  } as AppState);

describe('DemoMealGateway', () => {
  it('returns demo meals for demo restaurant', async () => {
    const store = new DemoMealsStore();
    const gateway = new DemoMealGateway(null, store, () => createState('-1'));

    const meals = await gateway.getMeals();
    expect(meals.length).toBeGreaterThan(0);
  });

  it('returns API meals for real restaurant', async () => {
    const store = new DemoMealsStore();
    const primary: IMealGateway = {
      getMeals: async () => [
        { id: '10', restaurantId: '10', title: 'API', type: 'ENTRY', price: 5, requiredAge: null, imageUrl: '' },
      ],
    };
    const gateway = new DemoMealGateway(primary, store, () => createState('10'));

    const meals = await gateway.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].id).toBe('10');
  });
});
