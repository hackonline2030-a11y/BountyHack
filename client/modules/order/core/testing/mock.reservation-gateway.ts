import { IReservationGateway, ReserveResult, AddMealsResult } from "@taotask/modules/order/core/gateway/reservation.gateway";
import { ReserveDTO } from "@taotask/modules/order/core/gateway/reserve.dto";

// Mock gateway with assertion methods for testing
export class MockReservationGateway implements IReservationGateway {
    private reserveCallData: ReserveDTO | null = null;
    private reserveCallIsQrOrder: boolean | undefined = undefined;
    private addMealsCallData: { reservationId: number; data: ReserveDTO } | null = null;
    private nextCode: string = 'TEST123';
    private nextGuestCount: number = 1;

    async reserve(data: ReserveDTO, isQrOrder?: boolean): Promise<ReserveResult> {
        this.reserveCallData = data;
        this.reserveCallIsQrOrder = isQrOrder;
        return { code: this.nextCode };
    }

    async addMeals(reservationId: number, data: ReserveDTO): Promise<AddMealsResult> {
        this.addMealsCallData = { reservationId, data };
        return { guestCount: this.nextGuestCount };
    }

    // Test helper to set the code that will be returned
    setNextCode(code: string): void {
        this.nextCode = code;
    }

    // Test helper to set guest count for addMeals
    setNextGuestCount(count: number): void {
        this.nextGuestCount = count;
    }

    // Assertion method
    expectReserveWasCallWith(data: ReserveDTO, isQrOrder?: boolean): void {
        expect(this.reserveCallData).toEqual(data);
        if (isQrOrder !== undefined) {
            expect(this.reserveCallIsQrOrder).toBe(isQrOrder);
        }
    }

    // Assertion method for addMeals
    expectAddMealsWasCallWith(reservationId: number, data: ReserveDTO): void {
        expect(this.addMealsCallData?.reservationId).toBe(reservationId);
        expect(this.addMealsCallData?.data).toEqual(data);
    }

    async launchOrder(): Promise<void> {
        // Mock implementation - does nothing
    }
}
