import { createTestStore } from "@taotask/modules/testing/tests-environment";
import { StubTableGateway } from "@taotask/modules/order/core/testing/stub.table-gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { initQrMode } from "@taotask/modules/order/core/useCase/init-qr-mode.usecase";
import { FailingTableGateway } from "@taotask/modules/order/core/testing/failing.table-gateway";

describe("Init QR mode", () => {
    const tables: OrderingDomainModel.Table[] = [
        { id: "table-1", title: "Table 1", capacity: 4 },
        { id: "table-2", title: "Table 2", capacity: 6 },
        { id: "table-3", title: "Table 3", capacity: 2 },
    ];

    it("should set QR mode and navigate to QR_GUESTS step when table is valid", async () => {
        const store = createTestStore({
            dependencies: {
                tableGateway: new StubTableGateway(tables),
            },
        });

        await store.dispatch(initQrMode({ restaurantId: "resto-1", tableId: "table-2" }));

        const state = store.getState().ordering;
        expect(state.isQrMode).toBe(true);
        expect(state.restaurantId).toBe("resto-1");
        expect(state.form.tableId).toBe("table-2");
        expect(state.qrTableCapacity).toBe(6);
        expect(state.step).toBe(OrderingDomainModel.OrderingStep.QR_GUESTS);
        expect(state.qrError).toBeNull();
    });

    it("should fallback to RESTAURANT step when table does not exist", async () => {
        const store = createTestStore({
            dependencies: {
                tableGateway: new StubTableGateway(tables),
            },
        });

        await store.dispatch(initQrMode({ restaurantId: "resto-1", tableId: "invalid-table" }));

        const state = store.getState().ordering;
        expect(state.isQrMode).toBe(false);
        expect(state.step).toBe(OrderingDomainModel.OrderingStep.RESTAURANT);
        expect(state.qrError).toBe("Table introuvable");
    });

    it("should fallback to RESTAURANT step when gateway fails", async () => {
        const store = createTestStore({
            dependencies: {
                tableGateway: new FailingTableGateway(),
            },
        });

        await store.dispatch(initQrMode({ restaurantId: "resto-1", tableId: "table-1" }));

        const state = store.getState().ordering;
        expect(state.isQrMode).toBe(false);
        expect(state.step).toBe(OrderingDomainModel.OrderingStep.RESTAURANT);
        expect(state.qrError).toBe("Impossible de charger les tables");
    });

    it("should store table in availableTables after successful init", async () => {
        const store = createTestStore({
            dependencies: {
                tableGateway: new StubTableGateway(tables),
            },
        });

        await store.dispatch(initQrMode({ restaurantId: "resto-1", tableId: "table-1" }));

        const state = store.getState().ordering;
        expect(state.availableTables.data).toEqual(tables);
        expect(state.availableTables.status).toBe("success");
    });

    it("should navigate to EXISTING_ORDER step when table has active order", async () => {
        const stubGateway = new StubTableGateway(tables);
        stubGateway.setActiveOrder({
            id: 42,
            reservationCode: "XYZ789",
            status: "SEATED",
            guestCount: 3
        });
        const store = createTestStore({
            dependencies: {
                tableGateway: stubGateway,
            },
        });

        await store.dispatch(initQrMode({ restaurantId: "resto-1", tableId: "table-2" }));

        const state = store.getState().ordering;
        expect(state.isQrMode).toBe(true);
        expect(state.step).toBe(OrderingDomainModel.OrderingStep.EXISTING_ORDER);
        expect(state.existingOrder).toEqual({
            id: 42,
            reservationCode: "XYZ789",
            status: "SEATED",
            guestCount: 3
        });
    });

    it("should proceed to QR_GUESTS when table has no active order", async () => {
        const stubGateway = new StubTableGateway(tables);
        // No active order set (default is null)
        const store = createTestStore({
            dependencies: {
                tableGateway: stubGateway,
            },
        });

        await store.dispatch(initQrMode({ restaurantId: "resto-1", tableId: "table-1" }));

        const state = store.getState().ordering;
        expect(state.step).toBe(OrderingDomainModel.OrderingStep.QR_GUESTS);
        expect(state.existingOrder).toBeNull();
    });
});
