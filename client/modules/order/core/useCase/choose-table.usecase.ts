import { orderingSlice } from "@taotask/modules/order/core/store/ordering.slice";
import { AppDispatch, AppGetState } from "@taotask/modules/store/store";

export const chooseTable 
= (tableId: string) => (dispatch: AppDispatch, getState: AppGetState) => {
    dispatch(orderingSlice.actions.chooseTable(tableId));
}