import { useAppDispatch, useAppSelector } from "@taotask/modules/store/store";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { orderingSlice } from "@taotask/modules/order/core/store/ordering.slice";
import OrderingStep = OrderingDomainModel.OrderingStep;

export const useReserved = () => {
    const dispatch = useAppDispatch();
    const isTerminalMode = useAppSelector((state) => state.ordering.isTerminalMode);
    const isQrMode = useAppSelector((state) => state.ordering.isQrMode);
    const reservation = useAppSelector((state) => state.ordering.reservation);

    const reservationCode = reservation.status === 'success' ? reservation.reservationCode : null;

    function onNewTable() {
        dispatch(orderingSlice.actions.setStep(OrderingStep.GUESTS));
    }

    return {
        onNewTable,
        isTerminalMode,
        isQrMode,
        reservationCode,
    };
};
