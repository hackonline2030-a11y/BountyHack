import { ITableGateway } from "@taotask/modules/order/core/gateway/table.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { AppState } from "@taotask/modules/store/store";
import { HttpClient } from "@taotask/modules/shared/infrastructure/http-client";

type BackendTable = {
    id: string;
    restaurantId: string;
    title: string;
    capacity: number;
}

type BackendReservation = {
    id: number;
    reservationCode: string;
    status: string;
    guests: unknown[];
}

const mapBackendTableToDomain = (backendTable: BackendTable): OrderingDomainModel.Table => {
    return {
        id: backendTable.id,
        title: backendTable.title,
        capacity: backendTable.capacity
    };
};

const mapBackendReservationToExistingOrder = (reservation: BackendReservation): OrderingDomainModel.ExistingOrder => {
    return {
        id: reservation.id,
        reservationCode: reservation.reservationCode,
        status: reservation.status,
        guestCount: reservation.guests.length
    };
};

export class HttpTableGateway implements ITableGateway {
    constructor(
        private readonly httpClient: HttpClient,
        private readonly getState: () => AppState
    ) {}

    async getTables(): Promise<OrderingDomainModel.Table[]> {
        const state = this.getState();
        const restaurantId = state.ordering.restaurantId;

        if (!restaurantId) {
            return [];
        }

        const backendTables = await this.httpClient.get<BackendTable[]>(`/tables?restaurantId=${restaurantId}`);
        return backendTables.map(mapBackendTableToDomain);
    }

    async getActiveOrder(tableId: string): Promise<OrderingDomainModel.ExistingOrder | null> {
        const response = await this.httpClient.get<BackendReservation | null>(`/tables/${tableId}/active-order`);
        if (!response) {
            return null;
        }
        return mapBackendReservationToExistingOrder(response);
    }
}
