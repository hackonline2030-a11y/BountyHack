import {GuestFactory} from "@taotask/modules/order/core/model/guest.factory";
import {createTestStore} from "@taotask/modules/testing/tests-environment";
import {chooseMeal} from "@taotask/modules/order/core/useCase/choose-meal.usecase";
import {OrderingDomainModel} from "@taotask/modules/order/core/model/ordering.domain-model";

const guestForm: OrderingDomainModel.Form = {
    guests: [
        GuestFactory.create({
            id: "1",
            meals: {
                entries: [{ mealId: "entry-1", quantity: 1 }],
                mainCourses: [{ mealId: "main-1", quantity: 1 }],
                desserts: [],
                drinks: []
            }
        })
    ],
    organizerId: "1",
    tableId: "1"
}
describe("Choosing a meal", () => {

    it("Should choose a meal", () => {
        const store = createTestStore()
        store.dispatch(chooseMeal(guestForm))
        expect(store.getState().ordering.form.guests).toEqual(guestForm.guests)
    })
})