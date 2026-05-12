import { useState, useEffect, useRef, useCallback } from 'react';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { useAppDispatch } from '@taotask/modules/store/store';
import { orderingActions } from '@taotask/modules/order/core/store/ordering.slice';
import { useDependencies } from '@taotask/modules/app/react/DependenciesProvider';
import { initQrMode } from '@taotask/modules/order/core/useCase/init-qr-mode.usecase';
import { classifyApiError } from '@taotask/modules/shared/error.utils';
import { isDemoRestaurantId } from '@taotask/modules/shared/demo/demo-restaurants.store';

export interface UseOrderPageOptions {
    restaurantId?: string;
    tableId?: string;
    qrRestaurantId?: string;
}

const EMPTY_RESTAURANT_LIST: OrderingDomainModel.RestaurantList = {
    restaurants: [],
    restaurantId: ""
};

export const useOrderPage = (options?: UseOrderPageOptions) => {
    const dispatch = useAppDispatch();
    const dependencies = useDependencies();
    const isTerminalMode = !!options?.restaurantId;
    const isQrMode = !!(options?.tableId && options?.qrRestaurantId);

    const animText = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastNonEmptyRestaurants = useRef<OrderingDomainModel.Restaurant[]>([]);
    const [restaurantList, setRestaurantList] = useState<OrderingDomainModel.RestaurantList>(EMPTY_RESTAURANT_LIST);
    const [restaurantsStatus, setRestaurantsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [meals, setMeals] = useState<OrderingDomainModel.Meal[]>([]);
    const [restaurantNotice, setRestaurantNotice] = useState<{ type: 'info' | 'error'; message: string } | null>(null);

    const fetchMealsForRestaurant = useCallback(async () => {
        try {
            const fetchedMeals = await dependencies.mealGateway?.getMeals() || [];
            setMeals(fetchedMeals);
        } catch (error) {
            console.error('Failed to fetch meals:', error);
            setMeals([]);
        }
    }, [dependencies.mealGateway]);

    const getGatewayError = () => {
        const gateway = dependencies.restaurantGateway;
        if (gateway && 'getLastError' in gateway) {
            return (gateway as { getLastError: () => unknown }).getLastError();
        }
        return null;
    };

    const updateRestaurantNotice = useCallback((restaurants: OrderingDomainModel.Restaurant[]) => {
        const hasDemoRestaurants = restaurants.some((restaurant) => isDemoRestaurantId(restaurant.id));
        const gatewayError = getGatewayError();

        if (gatewayError) {
            const { kind, message } = classifyApiError(gatewayError);
            const prefix = kind === 'connection'
                ? "Mode démo : API indisponible."
                : `Erreur API : ${message}.`;
            setRestaurantNotice({
                type: 'error',
                message: `${prefix} Nous affichons donc deux restaurants d'exemple. Le reste doit être ajouté via l'api.`,
            });
            return;
        }

        if (hasDemoRestaurants) {
            setRestaurantNotice({
                type: 'info',
                message: "Mode démo : nous affichons deux restaurants d'exemple. Le reste doit être ajouté via l'api.",
            });
            return;
        }

        setRestaurantNotice(null);
    }, [dependencies.restaurantGateway]);

    useEffect(() => {
        if (!restaurantNotice) {
            return;
        }
        const timeoutId = window.setTimeout(() => {
            setRestaurantNotice(null);
        }, 5000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [restaurantNotice]);

    const displayRestaurants = useCallback(async () => {
        try {
            setRestaurantsStatus('loading');
            const restaurants = await dependencies.restaurantGateway?.getRestaurants() || [];
            if (restaurants.length > 0) {
                lastNonEmptyRestaurants.current = restaurants;
            }
            const nextRestaurants =
                restaurants.length > 0 ? restaurants : lastNonEmptyRestaurants.current;
            setRestaurantList({ restaurants: nextRestaurants, restaurantId: "" });
            updateRestaurantNotice(nextRestaurants);
            setRestaurantsStatus('success');
        } catch (error) {
            console.error('Failed to fetch restaurants:', error);
            if (lastNonEmptyRestaurants.current.length > 0) {
                setRestaurantList({ restaurants: lastNonEmptyRestaurants.current, restaurantId: "" });
                updateRestaurantNotice(lastNonEmptyRestaurants.current);
                setRestaurantsStatus('success');
            } else {
                setRestaurantList(EMPTY_RESTAURANT_LIST);
                setRestaurantNotice(null);
                setRestaurantsStatus('error');
            }
        }
    }, [dependencies.restaurantGateway, updateRestaurantNotice]);

    const selectRestaurant = useCallback((id: string) => {
        setRestaurantList(prev => ({ ...prev, restaurantId: id }));
        dispatch(orderingActions.setRestaurantId(id));
        fetchMealsForRestaurant();
    }, [dispatch, fetchMealsForRestaurant]);

    const initTerminalMode = useCallback(async (restaurantId: string) => {
        try {
            const restaurants = await dependencies.restaurantGateway?.getRestaurants() || [];
            const restaurant = restaurants.find(r => r.id === restaurantId);
            if (restaurant) {
                setRestaurantList({ restaurants: [restaurant], restaurantId });
                dispatch(orderingActions.setRestaurantId(restaurantId));
                dispatch(orderingActions.setTerminalMode(true));
                fetchMealsForRestaurant();
                updateRestaurantNotice(restaurants);
            } else {
                console.error('Restaurant not found:', restaurantId);
            }
        } catch (error) {
            console.error('Failed to init terminal mode:', error);
        }
    }, [dependencies.restaurantGateway, dispatch, fetchMealsForRestaurant]);

    const initQrModeFlow = useCallback(async (restaurantId: string, tableId: string) => {
        try {
            const restaurants = await dependencies.restaurantGateway?.getRestaurants() || [];
            const restaurant = restaurants.find(r => String(r.id) === restaurantId);
            if (restaurant) {
                setRestaurantList({ restaurants: [restaurant], restaurantId: restaurant.id });
                fetchMealsForRestaurant();
            }
            updateRestaurantNotice(restaurants);
            dispatch(initQrMode({ restaurantId, tableId }));
        } catch (error) {
            console.error('Failed to init QR mode:', error);
        }
    }, [dependencies.restaurantGateway, dispatch, fetchMealsForRestaurant]);

    useEffect(() => {
        if (!isTerminalMode && !isQrMode) {
            displayRestaurants();
        }
    }, [isTerminalMode, isQrMode, displayRestaurants]);

    useEffect(() => {
        if (isTerminalMode && options?.restaurantId) {
            initTerminalMode(options.restaurantId);
        }
    }, [isTerminalMode, options?.restaurantId, initTerminalMode]);

    useEffect(() => {
        if (isQrMode && options?.qrRestaurantId && options?.tableId) {
            initQrModeFlow(options.qrRestaurantId, options.tableId);
        }
    }, [isQrMode, options?.qrRestaurantId, options?.tableId, initQrModeFlow]);

    return {
        isTerminalMode,
        isQrMode,
        bottomRef,
        selectRestaurant,
        restaurantList,
        restaurantsStatus,
        meals,
        restaurantNotice,
        animText
    };
};
