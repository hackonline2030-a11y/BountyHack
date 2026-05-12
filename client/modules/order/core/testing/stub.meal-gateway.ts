// Approche de chicago (TDD) > on se créer un stub pour nos tests
import { IMealGateway } from "@taotask/modules/order/core/gateway/meal.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

// 1. On créer un stub pour nos tests et ensuite on va donc changer nos test dans fetch table usecase test
export class StubMealGateway implements IMealGateway {
    constructor(private data: OrderingDomainModel.Meal[] = []){}

    async getMeals(): Promise<OrderingDomainModel.Meal[]> {
        return this.data;
    }
    
}