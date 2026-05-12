import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
// En architecture hexagonale on appelle cette interface un port
// Ce port se place entre mon domain et l'infastructure
// Aprés on doit créer un adapteur pour implémenter ce port
export interface ITableGateway {
    getTables(): Promise<OrderingDomainModel.Table[]>;
    getActiveOrder(tableId: string): Promise<OrderingDomainModel.ExistingOrder | null>;
}
