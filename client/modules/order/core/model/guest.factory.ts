import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
export class GuestFactory {

    static create(data?:Partial<OrderingDomainModel.Guest>):OrderingDomainModel.Guest {
        return {
            id: '',
            firstName: '',
            lastName: '',
            age: 24,
            meals: {
                entries: [],
                mainCourses: [],
                desserts: [],
                drinks: []
            },
            restaurantId: null,
            isOrganizer: false,
            menuId: null,
            ...data
        }
    }
}