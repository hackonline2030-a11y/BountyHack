import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useDependencies } from '@taotask/modules/app/react/DependenciesProvider';
import { GuestForm } from '@taotask/modules/order/core/form/guest.form';
import { AppState, useAppDispatch } from '@taotask/modules/store/store';
import { orderingActions } from '@taotask/modules/order/core/store/ordering.slice';
import { IIDProvider } from '@taotask/modules/core/id-provider';

export const useQrGuestSection = () => {
    const dispatch = useAppDispatch();
    const idProvider = useDependencies().idProvider;
    const guestForm = useRef(new GuestForm(idProvider as IIDProvider));

    const qrTableCapacity = useSelector((state: AppState) => state.ordering.qrTableCapacity);
    const selectedMenuId = useSelector((state: AppState) => state.ordering.selectedMenuId);
    const initialForm = useSelector((state: AppState) => state.ordering.form);

    const [guestCount, setGuestCount] = useState(1);

    const maxGuests = qrTableCapacity || 1;

    const increment = () => {
        if (guestCount < maxGuests) {
            setGuestCount(prev => prev + 1);
        }
    };

    const decrement = () => {
        if (guestCount > 1) {
            setGuestCount(prev => prev - 1);
        }
    };

    const onSubmit = () => {
        // Initialize guests with selected count
        let form = guestForm.current.initializeGuests(initialForm, guestCount, selectedMenuId);
        // Apply placeholder defaults ("Invité 1", "Invité 2", etc.)
        form = guestForm.current.applyPlaceholderDefaults(form);
        // Dispatch to Redux
        dispatch(orderingActions.chooseQrGuestCount(form));
    };

    return {
        guestCount,
        maxGuests,
        increment,
        decrement,
        onSubmit,
        canIncrement: guestCount < maxGuests,
        canDecrement: guestCount > 1,
    };
};
