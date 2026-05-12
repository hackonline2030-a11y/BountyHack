import { orderingSlice } from "@taotask/modules/order/core/store/ordering.slice";
import { extractErrorMessage } from "@taotask/modules/shared/error.utils";
import { Dependencies } from "@taotask/modules/store/dependencies";
import { AppDispatch, AppGetState } from "@taotask/modules/store/store";

export const fetchMeals = async (dispatch: AppDispatch, _: AppGetState, dependencies:Dependencies) => {
    dispatch(orderingSlice.actions.handleMealsLoading())
    try {
        const meals = await dependencies.mealGateway?.getMeals()
        // voir ordering.slice.ts pour les actions qu'on ajoute dés qu'on appel cette fonction ici
        dispatch(orderingSlice.actions.storeMeals(meals || []))

    } catch(e) {
        dispatch(orderingSlice.actions.handleMealsError(extractErrorMessage(e)))
    }
};
