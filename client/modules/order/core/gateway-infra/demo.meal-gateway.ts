import { IMealGateway } from '@taotask/modules/order/core/gateway/meal.gateway';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { DemoMealsStore } from '@taotask/modules/shared/demo/demo-meals.store';
import { mapDemoToOrderMeal } from '@taotask/modules/order/core/model/demo-meal.mapper';
import { AppState } from '@taotask/modules/store/store';
import { isDemoEntityId, toDemoNumberId } from '@taotask/modules/shared/demo/demo-utils';

export class DemoMealGateway implements IMealGateway {
  constructor(
    private readonly primary: IMealGateway | null,
    private readonly demoStore: DemoMealsStore,
    private readonly getState: () => AppState,
  ) {}

  async getMeals(): Promise<OrderingDomainModel.Meal[]> {
    const restaurantId = this.getState().ordering.restaurantId;
    if (!restaurantId) {
      return [];
    }

    let apiMeals: OrderingDomainModel.Meal[] = [];
    if (this.primary) {
      try {
        apiMeals = await this.primary.getMeals();
      } catch {
        apiMeals = [];
      }
    }

    if (!isDemoEntityId(restaurantId)) {
      return apiMeals;
    }

    const demoId = toDemoNumberId(restaurantId);
    if (demoId === null) {
      return apiMeals;
    }

    const demoMeals = this.demoStore.listByRestaurantId(demoId).map(mapDemoToOrderMeal);
    return [...demoMeals, ...apiMeals];
  }
}
