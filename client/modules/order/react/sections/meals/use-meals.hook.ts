import { MealForm } from "@taotask/modules/order/core/form/meal.form";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { orderingSlice, orderingActions } from "@taotask/modules/order/core/store/ordering.slice";
import { AppState, useAppDispatch } from "@taotask/modules/store/store";
import { useRef, useState } from 'react';
import { useSelector } from "react-redux";
import { chooseMeal } from "@taotask/modules/order/core/useCase/choose-meal.usecase";

export const useMeals = () => {
    const [currentGuestIndex, setCurrentGuestIndex] = useState(0);
    const menus: OrderingDomainModel.Menu[] = useSelector((state: AppState) => state.ordering.availableMenus.data);
    const menusStatus = useSelector((state: AppState) => state.ordering.availableMenus.status);
    const selectedMenuId = useSelector((state: AppState) => state.ordering.selectedMenuId);
    const isQrMode = useSelector((state: AppState) => state.ordering.isQrMode);
    const dispatch = useAppDispatch();
    const meals: OrderingDomainModel.Meal[] = useSelector((state: AppState) => state.ordering.availableMeals.data);
    const initialState = useSelector((state: AppState) => state.ordering.form);
    const [form, setForm] = useState<OrderingDomainModel.Form>(initialState);
    const mealForm = useRef(new MealForm());

    const currentGuest = form.guests[currentGuestIndex];
    const isLastGuest = currentGuestIndex === form.guests.length - 1;
    const isFirstGuest = currentGuestIndex === 0;

    const selectedMenu = selectedMenuId
        ? menus.find(m => m.id === selectedMenuId) || null
        : null;

    function getGuestMenu(guest: OrderingDomainModel.Guest): OrderingDomainModel.Menu | null {
        if (!guest.menuId) return null;
        return menus.find(m => m.id === guest.menuId) || null;
    }

    function getRequiredMealTypes(guest: OrderingDomainModel.Guest): OrderingDomainModel.MealType[] {
        const menu = getGuestMenu(guest);
        if (!menu) return [];
        return menu.items
            .filter(item => item.quantity > 0)
            .map(item => item.mealType);
    }

    function getMaxQuantityForType(guest: OrderingDomainModel.Guest, mealType: OrderingDomainModel.MealType): number {
        const A_LA_CARTE_MAX = 10;

        if (!guest.menuId) {
            return A_LA_CARTE_MAX;
        }

        const menu = getGuestMenu(guest);
        if (!menu) {
            return A_LA_CARTE_MAX;
        }

        const menuItem = menu.items.find(item => item.mealType === mealType);
        return menuItem?.quantity ?? 0;
    }

    function getTotalQuantityForType(guest: OrderingDomainModel.Guest, mealType: OrderingDomainModel.MealType): number {
        return mealForm.current.getTotalQuantityForType(guest, mealType);
    }

    function getMealQuantity(guest: OrderingDomainModel.Guest, mealId: string, mealType: OrderingDomainModel.MealType): number {
        return mealForm.current.getMealQuantity(guest, mealId, mealType);
    }

    function isMealSelected(guest: OrderingDomainModel.Guest, mealId: string, mealType: OrderingDomainModel.MealType): boolean {
        return mealForm.current.isMealSelected(guest, mealId, mealType);
    }

    function canAddMoreOfType(guest: OrderingDomainModel.Guest, mealType: OrderingDomainModel.MealType): boolean {
        const currentTotal = getTotalQuantityForType(guest, mealType);
        const maxAllowed = getMaxQuantityForType(guest, mealType);
        return currentTotal < maxAllowed;
    }

    function isGuestComplete(guest: OrderingDomainModel.Guest): boolean {
        const menu = getGuestMenu(guest);
        if (!menu) return true;

        return menu.items.every(item => {
            if (item.quantity === 0) return true;
            const currentTotal = getTotalQuantityForType(guest, item.mealType);
            return currentTotal >= item.quantity;
        });
    }

    function getMenuProgress(guest: OrderingDomainModel.Guest): { selected: number; total: number } | null {
        const menu = getGuestMenu(guest);
        if (!menu) return null;

        const total = menu.items.reduce((sum, item) => sum + item.quantity, 0);
        const selected = Object.values(OrderingDomainModel.MealType).reduce((sum, type) => {
            return sum + getTotalQuantityForType(guest, type);
        }, 0);

        return { selected, total };
    }

    function findGuestById(guestId: string) {
        return form.guests.find(guest => guest.id === guestId);
    }

    function getSelectableEntries(guest: OrderingDomainModel.Guest | string): OrderingDomainModel.Meal[] {
        const guestObj = typeof guest === 'string' ? findGuestById(guest) : guest;
        if (!guestObj) return [];
        return mealForm.current.getSelectableEntries(meals, guestObj);
    }

    function getSelectableMainCourses(guest: OrderingDomainModel.Guest | string): OrderingDomainModel.Meal[] {
        const guestObj = typeof guest === 'string' ? findGuestById(guest) : guest;
        if (!guestObj) return [];
        return mealForm.current.getSelectableMainCourse(meals, guestObj);
    }

    function getSelectableDesserts(guest: OrderingDomainModel.Guest | string): OrderingDomainModel.Meal[] {
        const guestObj = typeof guest === 'string' ? findGuestById(guest) : guest;
        if (!guestObj) return [];
        return mealForm.current.getSelectableDessert(meals, guestObj);
    }

    function getSelectableDrinks(guest: OrderingDomainModel.Guest | string): OrderingDomainModel.Meal[] {
        const guestObj = typeof guest === 'string' ? findGuestById(guest) : guest;
        if (!guestObj) return [];
        return mealForm.current.getSelectableDrink(meals, guestObj);
    }

    function onMealSelected(guestId: string, mealId: string, mealType: OrderingDomainModel.MealType) {
        const guest = form.guests.find(g => String(g.id) === guestId);
        if (!guest) return;

        const isSelected = isMealSelected(guest, mealId, mealType);

        if (isSelected) {
            const nextState = mealForm.current.toggleMealSelection(form, guestId, mealId, mealType);
            setForm(nextState);
        } else if (canAddMoreOfType(guest, mealType)) {
            const nextState = mealForm.current.toggleMealSelection(form, guestId, mealId, mealType);
            setForm(nextState);
        }
    }

    function incrementQuantity(guestId: string, mealId: string, mealType: OrderingDomainModel.MealType) {
        const guest = form.guests.find(g => String(g.id) === guestId);
        if (!guest) return;

        if (!canAddMoreOfType(guest, mealType)) return;

        const currentQty = getMealQuantity(guest, mealId, mealType);
        const nextState = mealForm.current.updateMealQuantity(form, guestId, mealId, mealType, currentQty + 1);
        setForm(nextState);
    }

    function decrementQuantity(guestId: string, mealId: string, mealType: OrderingDomainModel.MealType) {
        const guest = form.guests.find(g => String(g.id) === guestId);
        if (!guest) return;

        const currentQty = getMealQuantity(guest, mealId, mealType);
        const nextState = mealForm.current.updateMealQuantity(form, guestId, mealId, mealType, currentQty - 1);
        setForm(nextState);
    }

    function clearIncompatibleMeals(guest: OrderingDomainModel.Guest, menu: OrderingDomainModel.Menu | null): OrderingDomainModel.Guest {
        if (!menu) return guest;

        const requiredTypes = menu.items
            .filter(item => item.quantity > 0)
            .map(item => item.mealType);

        return {
            ...guest,
            meals: {
                entries: requiredTypes.includes(OrderingDomainModel.MealType.ENTRY) ? guest.meals.entries : [],
                mainCourses: requiredTypes.includes(OrderingDomainModel.MealType.MAIN_COURSE) ? guest.meals.mainCourses : [],
                desserts: requiredTypes.includes(OrderingDomainModel.MealType.DESSERT) ? guest.meals.desserts : [],
                drinks: requiredTypes.includes(OrderingDomainModel.MealType.DRINK) ? guest.meals.drinks : [],
            }
        };
    }

    function onSelectMenu(menuId: string | null) {
        dispatch(orderingActions.selectMenu(menuId));

        const newMenu = menuId ? menus.find(m => m.id === menuId) || null : null;

        if (currentGuest) {
            const updatedGuest = {
                ...clearIncompatibleMeals(currentGuest, newMenu),
                menuId: menuId
            };

            setForm(prevForm => ({
                ...prevForm,
                guests: prevForm.guests.map(g =>
                    g.id === currentGuest.id ? updatedGuest : g
                )
            }));
        }
    }

    function onNext() {
        dispatch(chooseMeal(form));
    }

    function onPrevious() {
        const previousStep = isQrMode
            ? OrderingDomainModel.OrderingStep.QR_GUESTS
            : OrderingDomainModel.OrderingStep.GUESTS;
        dispatch(orderingSlice.actions.setStep(previousStep));
    }

    function onSkip() {
        dispatch(chooseMeal(form));
        dispatch(orderingSlice.actions.setStep(OrderingDomainModel.OrderingStep.SUMMARY));
    }

    function onNextGuest() {
        if (!isLastGuest) {
            setCurrentGuestIndex(currentGuestIndex + 1);
        }
    }

    function onPreviousGuest() {
        if (!isFirstGuest) {
            setCurrentGuestIndex(currentGuestIndex - 1);
        }
    }

    function isSubmittable() {
        return mealForm.current.isSubmitable(form);
    }

    return {
        // Selectable meals
        getSelectableEntries,
        getSelectableMainCourses,
        getSelectableDesserts,
        getSelectableDrinks,
        // Meal selection
        onMealSelected,
        incrementQuantity,
        decrementQuantity,
        // Quantity helpers
        getMealQuantity,
        isMealSelected,
        getTotalQuantityForType,
        getMaxQuantityForType,
        canAddMoreOfType,
        // Navigation
        onNext,
        onPrevious,
        onSkip,
        onNextGuest,
        onPreviousGuest,
        onSelectMenu,
        // State
        meals: meals || [],
        guests: form.guests,
        currentGuest,
        currentGuestIndex,
        totalGuests: form.guests.length,
        isLastGuest,
        isFirstGuest,
        isSubmittable: isSubmittable(),
        // Menu
        menus,
        menusStatus,
        selectedMenuId,
        selectedMenu,
        getGuestMenu,
        getRequiredMealTypes,
        isGuestComplete,
        getMenuProgress,
    };
};
