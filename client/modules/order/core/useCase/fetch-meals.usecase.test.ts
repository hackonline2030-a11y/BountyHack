import { createTestStore } from "@taotask/modules/testing/tests-environment";
import { MealFactory } from "@taotask/modules/order/core/model/meal.factory";
import { fetchMeals } from "@taotask/modules/order/core/useCase/fetch-meals.usecase";
import { FailingMealGateway } from "@taotask/modules/order/core/testing/failing.meal-gateway";
import { StubMealGateway } from "@taotask/modules/order/core/testing/stub.meal-gateway";

describe("Fetch meals", () => {
    it("Should fetch a meal", async () => {
        const meal = MealFactory.create({ id: "1" });
        const listOfMeals = [meal];

        const store = createTestStore({
            dependencies: {
                mealGateway: new StubMealGateway(listOfMeals),    
            },
        });

        const promise = store.dispatch(fetchMeals);
        expect(store.getState().ordering.availableMeals.status).toEqual("loading");
       
        await promise;
        expect(store.getState().ordering.availableMeals.data).toEqual(listOfMeals);
        expect(store.getState().ordering.availableMeals.status).toEqual("success");
    });

    it("Should handle fetching meals errors", async () => {

        const store = createTestStore({
            dependencies: {
                mealGateway: new FailingMealGateway(),
            },
        });
        
        const promise = store.dispatch(fetchMeals);
        expect(store.getState().ordering.availableMeals.status).toEqual("loading");
        await promise;
        
        expect(store.getState().ordering.availableMeals.data).toEqual([]);
        expect(store.getState().ordering.availableMeals.status).toEqual("error");
        expect(store.getState().ordering.availableMeals.error).toEqual("Failed to fetch data");
    });
});
