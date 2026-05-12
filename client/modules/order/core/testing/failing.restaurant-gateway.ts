import { IRestaurantGateway } from "@taotask/modules/order/core/gateway/restaurant.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export class FailingRestaurantGateway implements IRestaurantGateway {
    async getRestaurants(): Promise<OrderingDomainModel.Restaurant[]> {
        throw new Error("Failed to fetch restaurants");
    }
}
