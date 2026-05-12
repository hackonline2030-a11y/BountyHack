import { createAsyncThunk } from "@reduxjs/toolkit";
import { Dependencies } from "@taotask/modules/store/dependencies";
import { orderingActions } from "@taotask/modules/order/core/store/ordering.slice";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

interface InitQrModeParams {
    restaurantId: string;
    tableId: string;
}

export const initQrMode = createAsyncThunk<
    void,
    InitQrModeParams,
    { extra: Dependencies }
>(
    "ordering/initQrMode",
    async ({ restaurantId, tableId }, { dispatch, extra }) => {
        dispatch(orderingActions.initQrMode({ restaurantId, tableId }));

        try {
            // Check for existing active order on this table
            const existingOrder = await extra.tableGateway!.getActiveOrder(tableId);
            if (existingOrder) {
                dispatch(orderingActions.setExistingOrder(existingOrder));
                dispatch(orderingActions.setStep(OrderingDomainModel.OrderingStep.EXISTING_ORDER));
                return;
            }

            const tables = await extra.tableGateway!.getTables();
            dispatch(orderingActions.storeTables(tables));

            const table = tables.find(t => String(t.id) === tableId);

            if (table) {
                dispatch(orderingActions.setQrTableCapacity(table.capacity));
                dispatch(orderingActions.setStep(OrderingDomainModel.OrderingStep.QR_GUESTS));
            } else {
                dispatch(orderingActions.setQrError("Table introuvable"));
                dispatch(orderingActions.setStep(OrderingDomainModel.OrderingStep.RESTAURANT));
            }
        } catch {
            dispatch(orderingActions.setQrError("Impossible de charger les tables"));
            dispatch(orderingActions.setStep(OrderingDomainModel.OrderingStep.RESTAURANT));
        }
    }
);
