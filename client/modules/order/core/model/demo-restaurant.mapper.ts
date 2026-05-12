import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { DemoRestaurant } from '@taotask/modules/shared/demo/demo-restaurants.store';

export const mapDemoToOrderRestaurant = (
  restaurant: DemoRestaurant,
): OrderingDomainModel.Restaurant => ({
  id: restaurant.id,
  restaurantName: restaurant.name,
  restaurantType: restaurant.type,
  stars: restaurant.stars,
});
