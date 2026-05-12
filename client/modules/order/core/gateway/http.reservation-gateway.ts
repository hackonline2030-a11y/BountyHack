import { IReservationGateway, ReserveResult, AddMealsResult } from "@taotask/modules/order/core/gateway/reservation.gateway";
import { ReserveDTO, GuestDTO } from "@taotask/modules/order/core/gateway/reserve.dto";
import { AppState } from "@taotask/modules/store/store";
import { HttpClient } from "@taotask/modules/shared/infrastructure/http-client";

type BackendGuestDto = {
    firstName: string;
    lastName: string;
    age: number;
    isOrganizer: boolean;
    entryId?: number;
    entryQuantity?: number;
    mainCourseId?: number;
    mainCourseQuantity?: number;
    dessertId?: number;
    dessertQuantity?: number;
    drinkId?: number;
    drinkQuantity?: number;
}

type BackendCreateReservationDto = {
    restaurantId: string;
    tableId: string;
    guests: BackendGuestDto[];
    isQrOrder?: boolean;
}

const mapGuestToBackend = (guest: GuestDTO): BackendGuestDto => {
    const backendGuest: BackendGuestDto = {
        firstName: guest.firstName,
        lastName: guest.lastName,
        age: guest.age,
        isOrganizer: guest.isOrganizer || false,
    };

    const entry = guest.meals.entries[0];
    if (entry) {
        backendGuest.entryId = Number(entry.mealId);
        backendGuest.entryQuantity = entry.quantity;
    }

    const mainCourse = guest.meals.mainCourses[0];
    if (mainCourse) {
        backendGuest.mainCourseId = Number(mainCourse.mealId);
        backendGuest.mainCourseQuantity = mainCourse.quantity;
    }

    const dessert = guest.meals.desserts[0];
    if (dessert) {
        backendGuest.dessertId = Number(dessert.mealId);
        backendGuest.dessertQuantity = dessert.quantity;
    }

    const drink = guest.meals.drinks[0];
    if (drink) {
        backendGuest.drinkId = Number(drink.mealId);
        backendGuest.drinkQuantity = drink.quantity;
    }

    return backendGuest;
};

const mapReserveDtoToBackend = (dto: ReserveDTO, restaurantId: string, isQrOrder?: boolean): BackendCreateReservationDto => {
    return {
        restaurantId,
        tableId: dto.tableId,
        guests: dto.guests.map(mapGuestToBackend),
        ...(isQrOrder !== undefined && { isQrOrder })
    };
};

export class HttpReservationGateway implements IReservationGateway {
    constructor(
        private readonly httpClient: HttpClient,
        private readonly getState: () => AppState
    ) {}

    async reserve(data: ReserveDTO, isQrOrder?: boolean): Promise<ReserveResult> {
        const state = this.getState();
        const restaurantId = state.ordering.restaurantId;

        if (!restaurantId) {
            throw new Error('Restaurant ID is required for reservation');
        }

        const backendDto = mapReserveDtoToBackend(data, restaurantId.toString(), isQrOrder);
        const response = await this.httpClient.post<{ reservationCode: string }>('/reservations', backendDto);
        return { code: response.reservationCode };
    }

    async addMeals(reservationId: number, data: ReserveDTO): Promise<AddMealsResult> {
        const backendGuests = data.guests.map(mapGuestToBackend);

        const response = await this.httpClient.patch<{ guests: unknown[] }>(
            `/reservations/${reservationId}/meals`,
            { guests: backendGuests }
        );
        return { guestCount: response.guests.length };
    }

    async launchOrder(reservationId: number): Promise<void> {
        await this.httpClient.patch(
            `/reservations/${reservationId}/status`,
            { status: 'IN_PREPARATION' }
        );
    }
}
