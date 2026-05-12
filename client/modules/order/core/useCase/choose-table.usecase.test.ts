import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { chooseTable } from "@taotask/modules/order/core/useCase/choose-table.usecase";
import { createTestStore } from "@taotask/modules/testing/tests-environment";

describe("Choose Table", () => {
    it("Should choose a table", () => {
        const store = createTestStore();
        store.dispatch(chooseTable("1"));
        expect(store.getState().ordering.form.tableId).toEqual("1");
    });
});


