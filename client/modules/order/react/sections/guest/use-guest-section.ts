import { useState, useRef, useEffect } from 'react';
import { useDependencies } from '@taotask/modules/app/react/DependenciesProvider';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { GuestForm } from '@taotask/modules/order/core/form/guest.form';
import { AppState, useAppDispatch } from '@taotask/modules/store/store';
import { chooseGuests } from '@taotask/modules/order/core/useCase/choose-guest.usecase';
import { IIDProvider } from '@taotask/modules/core/id-provider';
import { useSelector } from 'react-redux';
import { orderingActions } from '@taotask/modules/order/core/store/ordering.slice';

export const useGuestSection = () => {
    const selectedMenuId = useSelector((state: AppState) => state.ordering.selectedMenuId);
    const dispatch = useAppDispatch();
    const idProvider = useDependencies().idProvider;
    const guestForm = useRef(new GuestForm(idProvider as IIDProvider));
    const bottomGuestRef = useRef<HTMLDivElement>(null);
    const checkBoxOrganizer = useRef<HTMLInputElement>(null);
    const initialState = useSelector((state: AppState) => state.ordering.form);
    const tableCapacity = useSelector((state: AppState) => {
        const tableId = state.ordering.form.tableId;
        const table = state.ordering.availableTables.data?.find(t => t.id === tableId);
        return table?.capacity || 0;
    });

    const hasInitialized = useRef(false);

    const [form, setForm] = useState<OrderingDomainModel.Form>(() => {
        if (initialState.guests.length === 0 && tableCapacity > 0) {
            return guestForm.current.initializeGuests(initialState, tableCapacity, selectedMenuId);
        }
        return initialState;
    });

    useEffect(() => {
        if (!hasInitialized.current && form.guests.length === 0 && tableCapacity > 0) {
            const newState = guestForm.current.initializeGuests(form, tableCapacity, selectedMenuId);
            setForm(newState);
            hasInitialized.current = true;
        }
    }, [tableCapacity, selectedMenuId, form]);

    function addGuest() {
        const newState = guestForm.current.addGuest(form, selectedMenuId);
        setForm(newState);
    }

    function removeGuest(id:string) {
        const newState = guestForm.current.removeGuest(form, id);
        setForm(newState);
    }

    function updateGuest<T extends keyof OrderingDomainModel.Guest>
    (id:string, key: T, value: OrderingDomainModel.Guest[T]) {
        const newState = guestForm.current.updateGuest(form, id, key, value);
        setForm(newState);
    }

    function changeOrganizer(id: string | null) {
        const newState = guestForm.current.changeOrganizer(form, id);
        setForm(newState);
    }

    function onNext() {
        const formWithDefaults = guestForm.current.applyPlaceholderDefaults(form);
        dispatch(chooseGuests(formWithDefaults));
    }

    function onPrevious() {
        dispatch(orderingActions.setStep(OrderingDomainModel.OrderingStep.TABLE));
    }

    function isSubmitable() {
        return guestForm.current.isSubmitable(form)
    }

    useEffect(() => {
        bottomGuestRef.current?.scrollIntoView({behavior: 'smooth'});
      }, [form.guests.length]);

    return {
        addGuest,
        removeGuest,
        updateGuest,
        onNext,
        onPrevious,
        changeOrganizer,
        isSubmitable: isSubmitable(),
        form,
        bottomGuestRef,
        checkBoxOrganizer,
        tableCapacity,
        isAddGuestDisabled: form.guests.length >= tableCapacity,
    }
}