import { orderingSlice } from "@taotask/modules/order/core/store/ordering.slice";
import { Dependencies } from "@taotask/modules/store/dependencies";
import { AppDispatch, AppGetState } from "@taotask/modules/store/store";
import { extractErrorMessage } from "@taotask/modules/shared/error.utils"

export const fetchTables = async (dispatch: AppDispatch, _: AppGetState, dependencies:Dependencies) => {

    dispatch(orderingSlice.actions.handleTablesLoading());
    try {
        const tables = await dependencies.tableGateway?.getTables();
       
        dispatch(orderingSlice.actions.storeTables(tables || []));
        
    } catch(e) {
        
        dispatch(orderingSlice.actions.handleTablesError(extractErrorMessage(e)));
    }
};
