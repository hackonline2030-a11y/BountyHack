import { ITableGateway } from "@taotask/modules/order/core/gateway/table.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

// 1. On créer un stub pour nos tests de failed et ensuite on va donc changer nos test dans fetch table usecase test (3.)
// 1. Si je veux changer d'application et ne pas rester sur du React, j'ai quelque chose d'isolé et en plus de testable ici
export class FailingTableGateway implements ITableGateway {

    async getTables(): Promise<OrderingDomainModel.Table[]> {
        throw new Error("Failed to fetch data");
    }

    async getActiveOrder(): Promise<OrderingDomainModel.ExistingOrder | null> {
        throw new Error("Failed to fetch active order");
    }
}
