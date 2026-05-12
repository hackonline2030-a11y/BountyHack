import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export class MenuFactory {
    static create(overrides: Partial<OrderingDomainModel.Menu> = {}): OrderingDomainModel.Menu {
        return {
            id: "1",
            restaurantId: "1",
            title: "Menu Decouverte",
            description: "Entree + Plat + Dessert",
            price: 45,
            imageUrl: "/menu-decouverte.jpg",
            items: [
                { mealType: OrderingDomainModel.MealType.ENTRY, quantity: 1 },
                { mealType: OrderingDomainModel.MealType.MAIN_COURSE, quantity: 1 },
                { mealType: OrderingDomainModel.MealType.DESSERT, quantity: 1 },
            ],
            ...overrides,
        };
    }
}
