import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { orderingActions } from "@taotask/modules/order/core/store/ordering.slice";
import { AppDispatch, AppGetState } from "@taotask/modules/store/store";

export const chooseGuests = (form: OrderingDomainModel.Form) => 
async (dispatch: AppDispatch, getState: AppGetState) => {
    dispatch(orderingActions.chooseGuests(form));
}