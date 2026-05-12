import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export interface IRestaurantGateway {
    getRestaurants(): Promise<OrderingDomainModel.Restaurant[]>;
}
