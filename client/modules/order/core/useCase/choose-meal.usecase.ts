import {AppDispatch, AppState} from "@taotask/modules/store/store";
import {OrderingDomainModel} from "@taotask/modules/order/core/model/ordering.domain-model";
import {orderingSlice} from "@taotask/modules/order/core/store/ordering.slice";

export const chooseMeal = (form: OrderingDomainModel.Form) => (dispatch: AppDispatch) => {
    dispatch(orderingSlice.actions.chooseMeal(form))
}