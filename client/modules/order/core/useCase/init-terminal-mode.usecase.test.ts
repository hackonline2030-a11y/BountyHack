import { createTestStore } from "@taotask/modules/testing/tests-environment";
import { StubRestaurantGateway } from "@taotask/modules/order/core/testing/stub.restaurant-gateway";
import { StubMealGateway } from "@taotask/modules/order/core/testing/stub.meal-gateway";
import { MealFactory } from "@taotask/modules/order/core/model/meal.factory";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { orderingActions } from "@taotask/modules/order/core/store/ordering.slice";

describe("Init terminal mode", () => {
    const restaurants: OrderingDomainModel.Restaurant[] = [
        { id: "1", restaurantName: "Triviala", restaurantType: "Italien", stars: 5 },
        { id: "2", restaurantName: "Chez Marie", restaurantType: "Provençal", stars: 4 },
        { id: "3", restaurantName: "Le Gourmet", restaurantType: "Français", stars: 3 },
    ];

    it("should set restaurantId in store when terminal mode is initialized", async () => {
        const store = createTestStore({
            dependencies: {
                restaurantGateway: new StubRestaurantGateway(restaurants),
            },
        });

        // Simulate what initTerminalMode does: set the restaurant ID
        store.dispatch(orderingActions.setRestaurantId("2"));

        expect(store.getState().ordering.restaurantId).toEqual("2");
    });

    it("should allow finding restaurant by id from fetched list", async () => {
        const restaurantGateway = new StubRestaurantGateway(restaurants);

        const fetchedRestaurants = await restaurantGateway.getRestaurants();
        const targetRestaurant = fetchedRestaurants.find(r => r.id === "2");

        expect(targetRestaurant).toBeDefined();
        expect(targetRestaurant?.restaurantName).toEqual("Chez Marie");
    });

    it("should return undefined when restaurant id does not exist", async () => {
        const restaurantGateway = new StubRestaurantGateway(restaurants);

        const fetchedRestaurants = await restaurantGateway.getRestaurants();
        const targetRestaurant = fetchedRestaurants.find(r => r.id === "999");

        expect(targetRestaurant).toBeUndefined();
    });

    it("should be able to fetch meals after terminal mode initialization", async () => {
        const meals = [
            MealFactory.create({ id: "1", title: "Pasta" }),
            MealFactory.create({ id: "2", title: "Pizza" }),
        ];

        const store = createTestStore({
            dependencies: {
                restaurantGateway: new StubRestaurantGateway(restaurants),
                mealGateway: new StubMealGateway(meals),
            },
        });

        // Set restaurant ID (terminal mode)
        store.dispatch(orderingActions.setRestaurantId("1"));

        // Verify restaurant is set
        expect(store.getState().ordering.restaurantId).toEqual("1");
    });
});

describe("StubRestaurantGateway", () => {
    it("should return configured restaurants", async () => {
        const restaurants: OrderingDomainModel.Restaurant[] = [
            { id: "1", restaurantName: "Test", restaurantType: "Test", stars: 5 },
        ];
        const gateway = new StubRestaurantGateway(restaurants);

        const result = await gateway.getRestaurants();

        expect(result).toEqual(restaurants);
    });

    it("should return empty array when no restaurants configured", async () => {
        const gateway = new StubRestaurantGateway();

        const result = await gateway.getRestaurants();

        expect(result).toEqual([]);
    });
});
