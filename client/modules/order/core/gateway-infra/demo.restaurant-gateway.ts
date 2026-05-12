import { IRestaurantGateway } from '@taotask/modules/order/core/gateway/restaurant.gateway';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { DemoRestaurantsStore } from '@taotask/modules/shared/demo/demo-restaurants.store';
import { mapDemoToOrderRestaurant } from '@taotask/modules/order/core/model/demo-restaurant.mapper';

const mergeRestaurants = (
  demo: OrderingDomainModel.Restaurant[],
  api: OrderingDomainModel.Restaurant[],
): OrderingDomainModel.Restaurant[] => {
  const map = new Map<string, OrderingDomainModel.Restaurant>();
  demo.forEach((restaurant) => map.set(String(restaurant.id), restaurant));
  api.forEach((restaurant) => map.set(String(restaurant.id), restaurant));
  return Array.from(map.values());
};

export class DemoRestaurantGateway implements IRestaurantGateway {
  private lastError: unknown = null;
  private readonly fallbackDemo: OrderingDomainModel.Restaurant[];

  constructor(
    private readonly primary: IRestaurantGateway | null,
    private readonly demoStore: DemoRestaurantsStore,
  ) {
    this.fallbackDemo = this.demoStore.list().map(mapDemoToOrderRestaurant);
  }

  getLastError(): unknown {
    return this.lastError;
  }

  async getRestaurants(): Promise<OrderingDomainModel.Restaurant[]> {
    let apiRestaurants: OrderingDomainModel.Restaurant[] = [];

    if (this.primary) {
      try {
        apiRestaurants = await this.primary.getRestaurants();
        this.lastError = null;
      } catch (error) {
        this.lastError = error;
      }
    } else {
      this.lastError = null;
    }

    const demoRestaurants =
      this.demoStore.list().map(mapDemoToOrderRestaurant) || [];
    const safeDemoRestaurants =
      demoRestaurants.length > 0 ? demoRestaurants : this.fallbackDemo;
    return mergeRestaurants(safeDemoRestaurants, apiRestaurants);
  }
}
