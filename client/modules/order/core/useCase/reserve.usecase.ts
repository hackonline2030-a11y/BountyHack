import { AppDispatch, AppGetState } from "@taotask/modules/store/store";
import { orderingSlice } from "@taotask/modules/order/core/store/ordering.slice";
import { Dependencies } from "@taotask/modules/store/dependencies";
import { OrderingDomainModel } from "../model/ordering.domain-model";
import { ReserveDTO } from "../gateway/reserve.dto";
import { isDemoRestaurantId } from "@taotask/modules/shared/demo/demo-restaurants.store";

const buildReserveDTO = (form: OrderingDomainModel.Form): ReserveDTO => ({
    tableId: form.tableId!,
    guests: form.guests.map((guest: OrderingDomainModel.Guest) => ({
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        age: guest.age,
        isOrganizer: guest.id === form.organizerId,
        meals: {
            entries: guest.meals.entries,
            mainCourses: guest.meals.mainCourses,
            desserts: guest.meals.desserts,
            drinks: guest.meals.drinks,
        }
    }))
});

export const reserve = () => async (dispatch: AppDispatch, getState: AppGetState, { reservationGateway }: Dependencies) => {
    const state = getState().ordering;
    const form = state.form;
    const isQrMode = state.isQrMode;
    const existingOrder = state.existingOrder;
    const restaurantId = state.restaurantId;
    const isDemoRestaurant = restaurantId !== null && isDemoRestaurantId(restaurantId);

    dispatch(orderingSlice.actions.handleReservationLoading());

    const dto = buildReserveDTO(form);

    if (isDemoRestaurant) {
        const demoCode = `DEMO-${Date.now()}`;
        dispatch(orderingSlice.actions.handleReservationSuccess(demoCode));
        return;
    }

    // If there's an existing order, add meals to it instead of creating a new reservation
    if (existingOrder) {
        await reservationGateway?.addMeals(existingOrder.id, dto);
        dispatch(orderingSlice.actions.handleReservationSuccess(existingOrder.reservationCode));
        return;
    }

    const result = await reservationGateway?.reserve(dto, isQrMode);
    dispatch(orderingSlice.actions.handleReservationSuccess(result?.code || ''));
}