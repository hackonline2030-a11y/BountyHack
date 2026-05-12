import { ReserveDTO } from '@taotask/modules/order/core/gateway/reserve.dto'

export type ReserveResult = {
    code: string;
}

export type AddMealsResult = {
    guestCount: number;
}

export interface IReservationGateway {
    reserve(data: ReserveDTO, isQrOrder?: boolean): Promise<ReserveResult>
    addMeals(reservationId: number, data: ReserveDTO): Promise<AddMealsResult>
    launchOrder(reservationId: number): Promise<void>
}
