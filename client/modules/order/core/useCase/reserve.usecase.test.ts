// On va se faire un mock > dossier testing
import {MockReservationGateway} from "@taotask/modules/order/core/testing/mock.reservation-gateway";
import {createTestStore} from "@taotask/modules/testing/tests-environment";
import { reserve } from "@taotask/modules/order/core/useCase/reserve.usecase";
import {OrderingDomainModel} from "@taotask/modules/order/core/model/ordering.domain-model";
import {GuestFactory} from "@taotask/modules/order/core/model/guest.factory";
import {OrderingState} from "@taotask/modules/order/core/store/ordering.slice";

const orderForm: OrderingDomainModel.Form = {
    organizerId: "1",
    tableId: "1",
    guests: [
        GuestFactory.create({
            id: "1",
            firstName: "",
            lastName: "",
            age: 21,
            meals: {
                entries: [],
                mainCourses: [{ mealId: "1", quantity: 1 }],
                desserts: [],
                drinks: []
            }
        })
    ]
}

const orderingState: OrderingState = {
    step: OrderingDomainModel.OrderingStep.SUMMARY,
    form: orderForm,
    restaurantId: "1",
    isTerminalMode: false,
    isQrMode: false,
    qrTableCapacity: null,
    qrError: null,
    selectedMenuId: null,
    existingOrder: null,
    availableTables: {
        status: "idle",
        error: null,
        data: []
    },
    availableMeals: {
      status: "idle",
      error: null,
      data: []
    },
    availableMenus: {
      status: "idle",
      error: null,
      data: []
    },
    reservation: { status: "idle"}
}
describe("Reserve", () => {
    it("Should reserve successfully and return reservation code", async () => {
        const reservationGateway = new MockReservationGateway();
        reservationGateway.setNextCode('ABC123');
        const store = createTestStore({
            initialState: {
                ordering: orderingState
            },
            dependencies: {
                reservationGateway
            }
        })

        const promise = store.dispatch(reserve())
        expect(store.getState().ordering.reservation.status).toEqual("loading")
        await promise;

        const reservation = store.getState().ordering.reservation;
        expect(reservation.status).toEqual("success")
        if (reservation.status === "success") {
            expect(reservation.reservationCode).toEqual("ABC123")
        }

        reservationGateway.expectReserveWasCallWith({
            tableId: "1",
            guests: [
                {
                    id: "1",
                    firstName: "",
                    lastName: "",
                    age: 21,
                    isOrganizer: true,
                    meals: {
                        entries: [],
                        mainCourses: [{ mealId: "1", quantity: 1 }],
                        desserts: [],
                        drinks: []
                    }
                }
            ]
        })
        expect(store.getState().ordering.step).toEqual(OrderingDomainModel.OrderingStep.RESERVED)
    })
})
