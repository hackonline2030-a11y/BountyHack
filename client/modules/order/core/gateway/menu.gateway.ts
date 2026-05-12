import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export interface IMenuGateway {
    getMenus(restaurantId: string | number): Promise<OrderingDomainModel.Menu[]>;
    getMenu(id: string): Promise<OrderingDomainModel.Menu | null>;
}
