import { createTestStore } from "@taotask/modules/testing/tests-environment";
import { TableFactory } from "@taotask/modules/order/core/model/table.factory";
import { fetchTables } from "@taotask/modules/order/core/useCase/fetch-table.usecase";
import { StubTableGateway } from "@taotask/modules/order/core/testing/stub.table-gateway";
import { FailingTableGateway } from "@taotask/modules/order/core/testing/failing.table-gateway";

describe("Fetch table", () => {
    it("Should fetch a table", async () => {
        const table = TableFactory.create({ id: "1" });
        const listOfTables = [table];

        const store = createTestStore({
            dependencies: {
                // On ajoute cette nouvelle dépendance dans le tableau de dépendances (store/dependencies.ts)
                 // 3. (refactor) On appel le stub ici plutot
                tableGateway: new StubTableGateway(listOfTables),    
                    // {getTables: () => Promise.resolve(listOfTables),} 
            },
        });
        // 2. Les tests de status se font seulement aprés avoir poser les type et availableTables > status dans ordering.slice.ts
        // 2. Le 1er test qui échoue échoue donc forcément car 'idle' est la valeur par défaut (et non loading ou success)
        // 2. Pour que les test passe il faut alors dispatch une action qui va se charger du status (handleTableLoading) > voir fetch-table.usecase.ts

        // 2. Avant de résoudre la promise le status doit être égale à loading d'où la création d'une variable promise
        const promise = store.dispatch(fetchTables);
        expect(store.getState().ordering.availableTables.status).toEqual("loading");
        await promise;
        // 1. availableTables est un nouveau state ce qui a supposé la création de nouvelles entrées dans OrderingState et InitialState (store/ordering.slice.ts)
        // 1. Le 2e test qui échoue est: expect [ { capacity: 10, id: '1', title: 'Table 1' } ]‍ but has: ⁠[]⁠
        // 1. Ce 2e test engendre la création d'un 3e argument dans la fonction fetchTables (fetch-table.usecase.ts) ainsi que le dispatch
        expect(store.getState().ordering.availableTables.data).toEqual(listOfTables);
        //2. Pour que les test des status passe il faut transformer ce test en async
        expect(store.getState().ordering.availableTables.status).toEqual("success");
    });

    it("Should handle fetching table errors", async () => {

        const store = createTestStore({
            dependencies: {
                tableGateway: new FailingTableGateway(),
                    // 3. (refactor) On appel le stub ici plutot
                    //Ancienne version sans stub: {getTables: () => Promise.reject(new Error("Failed to fetch data")),}  
            },
        });
        
        const promise = store.dispatch(fetchTables);
        expect(store.getState().ordering.availableTables.status).toEqual("loading");
        await promise;
        
        expect(store.getState().ordering.availableTables.data).toEqual([]);
        expect(store.getState().ordering.availableTables.status).toEqual("error");
        expect(store.getState().ordering.availableTables.error).toEqual("Failed to fetch data");
    });
});



