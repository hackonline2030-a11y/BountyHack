import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDependencies } from '@taotask/modules/app/react/DependenciesProvider';
import { AppState, useAppDispatch } from '@taotask/modules/store/store';
import { orderingActions } from '@taotask/modules/order/core/store/ordering.slice';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';

export const useExistingOrder = () => {
    const dispatch = useAppDispatch();
    const { tableGateway, reservationGateway } = useDependencies();
    const existingOrder = useSelector((state: AppState) => state.ordering.existingOrder);
    const qrTableCapacity = useSelector((state: AppState) => state.ordering.qrTableCapacity);
    const tableId = useSelector((state: AppState) => state.ordering.form.tableId);
    const availableTables = useSelector((state: AppState) => state.ordering.availableTables.data);

    const [isLaunching, setIsLaunching] = useState(false);

    const onAddMoreItems = async () => {
        // Need to fetch tables and set capacity before going to QR_GUESTS
        if (availableTables.length === 0 && tableGateway) {
            const tables = await tableGateway.getTables();
            dispatch(orderingActions.storeTables(tables));

            const table = tables.find(t => String(t.id) === tableId);
            if (table) {
                dispatch(orderingActions.setQrTableCapacity(table.capacity));
            }
        }
        dispatch(orderingActions.setStep(OrderingDomainModel.OrderingStep.QR_GUESTS));
    };

    const onLaunchOrder = async () => {
        if (!existingOrder || !reservationGateway) return;

        setIsLaunching(true);
        try {
            await reservationGateway.launchOrder(existingOrder.id);
            // Go to reserved step to show confirmation
            dispatch(orderingActions.handleReservationSuccess(existingOrder.reservationCode));
        } catch (error) {
            console.error('Failed to launch order:', error);
            // Stay on current screen, user can retry
        } finally {
            setIsLaunching(false);
        }
    };

    return {
        existingOrder,
        tableCapacity: qrTableCapacity,
        onAddMoreItems,
        onLaunchOrder,
        isLaunching,
    };
};
