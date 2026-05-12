import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export type GuestDTO = {
    id?: string | number,
    firstName: string,
    lastName: string,
    age: number,
    isOrganizer?: boolean,
    meals: {
        entries: OrderingDomainModel.MealSelection[],
        mainCourses: OrderingDomainModel.MealSelection[],
        desserts: OrderingDomainModel.MealSelection[],
        drinks: OrderingDomainModel.MealSelection[]
    }
}

export type ReserveDTO = {
    tableId: string,
    guests: Array<GuestDTO>
}
