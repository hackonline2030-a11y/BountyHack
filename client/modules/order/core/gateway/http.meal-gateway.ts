import { IMealGateway } from "@taotask/modules/order/core/gateway/meal.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { AppState } from "@taotask/modules/store/store";
import { HttpClient } from "@taotask/modules/shared/infrastructure/http-client";

type BackendMeal = {
    id: string;
    restaurantId: string;
    title: string;
    type: 'ENTRY' | 'MAIN_COURSE' | 'DESSERT' | 'DRINK';
    price: number;
    requiredAge: number | null;
    imageUrl: string;
}

const mapBackendMealToDomain = (backendMeal: BackendMeal): OrderingDomainModel.Meal => {
    return {
        id: backendMeal.id,
        restaurantId: backendMeal.restaurantId,
        title: backendMeal.title,
        type: backendMeal.type as OrderingDomainModel.MealType,
        price: backendMeal.price,
        requiredAge: backendMeal.requiredAge,
        imageUrl: backendMeal.imageUrl
    }
}

export class HttpMealGateway implements IMealGateway {
    constructor(
        private readonly httpClient: HttpClient,
        private readonly getState: () => AppState
    ) {}

    async getMeals(): Promise<OrderingDomainModel.Meal[]> {
        const state = this.getState();
        const restaurantId = state.ordering.restaurantId;
        
        if (!restaurantId) {
            return [];
        }

        const backendMeals = await this.httpClient.get<BackendMeal[]>(`/meals?restaurantId=${restaurantId}`);
        return backendMeals.map(mapBackendMealToDomain);
    }
}