import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
export class MealFactory { 

    static create(data?:Partial<OrderingDomainModel.Meal>):OrderingDomainModel.Meal {
        return {
            id: '1',
            restaurantId: '1',
            imageUrl: '',
            title: '',
            type: OrderingDomainModel.MealType.ENTRY,
            price: 3.5,
            requiredAge: null,
            ...data
        }
    }
}