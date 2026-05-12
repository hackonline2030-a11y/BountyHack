import { IRestaurantGateway } from "@taotask/modules/order/core/gateway/restaurant.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export class InMemoryRestaurantGateway implements IRestaurantGateway {
    async getRestaurants(): Promise<OrderingDomainModel.Restaurant[]> {
        return [
            { id: "1", restaurantName: 'Triviala', restaurantType: 'Italien', stars: 6 },
            { id: "2", restaurantName: 'Chez Marie', restaurantType: 'Provençal', stars: 5 },
            { id: "3", restaurantName: 'Chez Tom', restaurantType: 'Cuisine du Ventoux', stars: 5 }
        ];
    }
}
