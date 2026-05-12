import { IRestaurantGateway } from "@taotask/modules/order/core/gateway/restaurant.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { HttpClient } from "@taotask/modules/shared/infrastructure/http-client";

type BackendRestaurant = {
    id: number;
    name: string;
    type: string;
    stars: number;
}

const mapBackendRestaurantToDomain = (backendRestaurant: BackendRestaurant): OrderingDomainModel.Restaurant => {
    return {
        id: backendRestaurant.id.toString(),
        restaurantName: backendRestaurant.name,
        restaurantType: backendRestaurant.type,
        stars: backendRestaurant.stars
    }
}

export class HttpRestaurantGateway implements IRestaurantGateway {
    constructor(private readonly httpClient: HttpClient) {}

    async getRestaurants(): Promise<OrderingDomainModel.Restaurant[]> {
        const backendRestaurants = await this.httpClient.get<BackendRestaurant[]>('/restaurants');
        return backendRestaurants.map(mapBackendRestaurantToDomain);
    }
}
