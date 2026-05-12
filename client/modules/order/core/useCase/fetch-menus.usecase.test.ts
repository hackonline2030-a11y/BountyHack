import { createTestStore } from "@taotask/modules/testing/tests-environment";
import { MenuFactory } from "@taotask/modules/order/core/model/menu.factory";
import { fetchMenus } from "@taotask/modules/order/core/useCase/fetch-menus.usecase";
import { FailingMenuGateway } from "@taotask/modules/order/core/testing/failing.menu-gateway";
import { StubMenuGateway } from "@taotask/modules/order/core/testing/stub.menu-gateway";
import { orderingActions } from "@taotask/modules/order/core/store/ordering.slice";

describe("Fetch menus", () => {
    it("Should fetch menus for a restaurant", async () => {
        const menu = MenuFactory.create({ id: "1" });
        const listOfMenus = [menu];

        const store = createTestStore({
            dependencies: {
                menuGateway: new StubMenuGateway(listOfMenus),
            },
        });

        // Set restaurant ID before fetching menus
        store.dispatch(orderingActions.setRestaurantId("1"));

        const promise = store.dispatch(fetchMenus);
        expect(store.getState().ordering.availableMenus.status).toEqual("loading");

        await promise;
        expect(store.getState().ordering.availableMenus.data).toEqual(listOfMenus);
        expect(store.getState().ordering.availableMenus.status).toEqual("success");
    });

    it("Should handle fetching menus errors", async () => {
        const store = createTestStore({
            dependencies: {
                menuGateway: new FailingMenuGateway(),
            },
        });

        // Set restaurant ID before fetching menus
        store.dispatch(orderingActions.setRestaurantId("1"));

        const promise = store.dispatch(fetchMenus);
        expect(store.getState().ordering.availableMenus.status).toEqual("loading");
        await promise;

        expect(store.getState().ordering.availableMenus.data).toEqual([]);
        expect(store.getState().ordering.availableMenus.status).toEqual("error");
        expect(store.getState().ordering.availableMenus.error).toEqual("Failed to fetch data");
    });

    it("Should return empty array if no restaurantId", async () => {
        const store = createTestStore({
            dependencies: {
                menuGateway: new StubMenuGateway([MenuFactory.create()]),
            },
        });

        await store.dispatch(fetchMenus);

        expect(store.getState().ordering.availableMenus.data).toEqual([]);
        expect(store.getState().ordering.availableMenus.status).toEqual("success");
    });
});
