import { orderingSlice } from "@taotask/modules/order/core/store/ordering.slice";
import { extractErrorMessage } from "@taotask/modules/shared/error.utils";
import { Dependencies } from "@taotask/modules/store/dependencies";
import { AppDispatch, AppGetState } from "@taotask/modules/store/store";

export const fetchMenus = async (
    dispatch: AppDispatch,
    getState: AppGetState,
    dependencies: Dependencies
) => {
    dispatch(orderingSlice.actions.handleMenusLoading());

    const state = getState();
    const restaurantId = state.ordering.restaurantId;

    if (!restaurantId) {
        dispatch(orderingSlice.actions.storeMenus([]));
        return;
    }

    try {
        const menus = await dependencies.menuGateway?.getMenus(restaurantId);
        dispatch(orderingSlice.actions.storeMenus(menus || []));
    } catch (e) {
        dispatch(orderingSlice.actions.handleMenusError(extractErrorMessage(e)));
    }
};
