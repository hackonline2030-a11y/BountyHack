import { DemoRestaurantGateway } from '@taotask/modules/order/core/gateway-infra/demo.restaurant-gateway';
import { DemoRestaurantsStore } from '@taotask/modules/shared/demo/demo-restaurants.store';
import { IRestaurantGateway } from '@taotask/modules/order/core/gateway/restaurant.gateway';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';

const createPrimaryGateway = (restaurants: OrderingDomainModel.Restaurant[]): IRestaurantGateway => ({
  getRestaurants: async () => restaurants,
});

describe('DemoRestaurantGateway', () => {
  it('merges demo restaurants with API restaurants', async () => {
    const demoStore = new DemoRestaurantsStore();
    const primary = createPrimaryGateway([
      { id: 10, restaurantName: 'API', restaurantType: 'Fusion', stars: 5 },
    ]);

    const gateway = new DemoRestaurantGateway(primary, demoStore);
    const restaurants = await gateway.getRestaurants();

    expect(restaurants.length).toBe(3);
    expect(gateway.getLastError()).toBeNull();
  });

  it('returns demo restaurants when API fails', async () => {
    const demoStore = new DemoRestaurantsStore();
    const error = new TypeError('Failed to fetch');
    const primary: IRestaurantGateway = {
      getRestaurants: async () => {
        throw error;
      },
    };

    const gateway = new DemoRestaurantGateway(primary, demoStore);
    const restaurants = await gateway.getRestaurants();

    expect(restaurants.length).toBe(2);
    expect(gateway.getLastError()).toBe(error);
  });
});
