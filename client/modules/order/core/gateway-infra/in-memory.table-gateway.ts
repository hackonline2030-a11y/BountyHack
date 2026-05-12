import { ITableGateway } from "@taotask/modules/order/core/gateway/table.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { TableFactory } from "@taotask/modules/order/core/model/table.factory";
// On a pas de bdd donc on créer de la fake data via in memory (notre gateway est nécessaire pour que ça fonctionne)
// Données externes >> promise >> async/await
export class InMemoryTableGateway implements ITableGateway {
    async getTables(): Promise<OrderingDomainModel.Table[]> {
        return [
            TableFactory.create({
                id : "1",
                title: "Prés de la fenêtre",
                capacity: 4
            }),
            TableFactory.create({
                id : "2",
                title: "Prés de la fenêtre",
                capacity: 4
            }),
            TableFactory.create({
                id : "3",
                title: "Au centre",
                capacity: 2
            }),
            TableFactory.create({
                id : "4",
                title: "Prés de la porte",
                capacity: 6
            }),
            TableFactory.create({
                id : "5",
                title: "A l'entrée",
                capacity: 10
            }),
            TableFactory.create({
                id : "6",
                title: "Prés du bar",
                capacity: 8
            })
        ]
    }

    async getActiveOrder(): Promise<OrderingDomainModel.ExistingOrder | null> {
        // In-memory gateway returns no existing order by default
        return null;
    }
}
