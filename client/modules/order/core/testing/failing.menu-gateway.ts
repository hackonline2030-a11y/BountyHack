import { IMenuGateway } from "@taotask/modules/order/core/gateway/menu.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export class FailingMenuGateway implements IMenuGateway {
    async getMenus(_restaurantId: string | number): Promise<OrderingDomainModel.Menu[]> {
        throw new Error("Failed to fetch data");
    }

    async getMenu(_id: string): Promise<OrderingDomainModel.Menu | null> {
        throw new Error("Failed to fetch data");
    }
}
