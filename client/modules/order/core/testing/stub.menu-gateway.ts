import { IMenuGateway } from "@taotask/modules/order/core/gateway/menu.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export class StubMenuGateway implements IMenuGateway {
    constructor(private data: OrderingDomainModel.Menu[] = []) {}

    async getMenus(_restaurantId: string | number): Promise<OrderingDomainModel.Menu[]> {
        return this.data;
    }

    async getMenu(id: string): Promise<OrderingDomainModel.Menu | null> {
        return this.data.find(menu => menu.id === id) || null;
    }
}
