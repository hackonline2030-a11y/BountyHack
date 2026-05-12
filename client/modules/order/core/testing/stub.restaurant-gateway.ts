import { IRestaurantGateway } from "@taotask/modules/order/core/gateway/restaurant.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export class StubRestaurantGateway implements IRestaurantGateway {
    constructor(private data: OrderingDomainModel.Restaurant[] = []) {}

    async getRestaurants(): Promise<OrderingDomainModel.Restaurant[]> {
        return this.data;
    }
}
