"use client"
import React from 'react';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { LuminousCard } from '@taotask/modules/order/react/components/ui/LuminousCard';
import { isDemoRestaurantId } from '@taotask/modules/shared/demo/demo-restaurants.store';

type RestaurantSectionProps = {
    restaurantList: OrderingDomainModel.RestaurantList,
    selectRestaurant: (id: string) => void,
    step: OrderingDomainModel.OrderingStep,
    restaurantNotice?: { type: 'info' | 'error'; message: string } | null,
    restaurantsStatus?: 'idle' | 'loading' | 'success' | 'error',
};

export const RestaurantSection: React.FC<RestaurantSectionProps> = ({
    restaurantList,
    selectRestaurant,
    step,
    restaurantNotice,
    restaurantsStatus = 'idle',
}) => {
    const noticeDurationMs = 5000;

    const isRestaurantStep = step === OrderingDomainModel.OrderingStep.RESTAURANT;

    const selectedRestaurant = restaurantList.restaurants.find(
        (r) => String(r.id) === String(restaurantList.restaurantId)
    );
    const hasSelectedRestaurant = Boolean(selectedRestaurant);
    const showRestaurantList =
        isRestaurantStep || !restaurantList.restaurantId || !hasSelectedRestaurant;
    const showWelcomeMessage =
        !isRestaurantStep && restaurantList.restaurantId && hasSelectedRestaurant;

    return (
    <>
    <LuminousCard className="mx-auto py-8 sm:py-12 w-full max-w-[1200px] animate-fade-in-down">
        {showRestaurantList && (
            <>
                <div className="mx-auto mb-5 w-full flex flex-col">
                    <h2 className="mx-auto my-3 text-xl sm:text-2xl font-display font-medium text-luminous-text-primary text-center">
                        Choisissez un restaurant
                    </h2>
                    <div className="h-1 w-16 bg-luminous-gold mx-auto my-4" />
                </div>

                {restaurantNotice && (
                    <div className={`mx-auto mb-6 w-full sm:w-2/3 rounded-xl px-5 py-4 border text-xs text-center relative overflow-hidden ${
                        restaurantNotice.type === 'error'
                            ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                            : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                    }`}>
                        {restaurantNotice.message}
                        <div
                            className="absolute bottom-0 left-0 h-1 w-full bg-orange-500/40 origin-left"
                            style={{ animation: `noticeShrink ${noticeDurationMs}ms linear forwards` }}
                        />
                    </div>
                )}

                <div className="w-full mx-auto flex flex-col justify-center gap-2">
                    <div className="flex gap-4 justify-center items-center flex-wrap">
                        {restaurantsStatus === 'loading' && (
                            <div className="my-5 mx-auto w-full sm:w-1/2 rounded-xl px-5 py-4 bg-luminous-gold/10 border border-luminous-gold text-luminous-gold">
                                <p className="text-center font-medium text-sm sm:text-base">
                                    Chargement des restaurants...
                                </p>
                            </div>
                        )}
                        {restaurantsStatus !== 'loading' && restaurantList.restaurants.length > 0 ? restaurantList.restaurants
                        .filter((restaurant) => restaurant.id)
                        .map((restaurant) => (
                            <div key={restaurant.id} className="w-full sm:w-auto">
                                <RestaurantRows
                                    id={restaurant.id.toString()}
                                    restaurantName={restaurant.restaurantName}
                                    restaurantType={restaurant.restaurantType}
                                    stars={restaurant.stars}
                                    isDemo={isDemoRestaurantId(restaurant.id)}
                                    selectRestaurant={selectRestaurant}
                                    selectedRestaurantId={restaurantList.restaurantId ? restaurantList.restaurantId.toString() : ""}
                                />
                            </div>
                        )) : restaurantsStatus !== 'loading' ? (
                            <div className="my-5 mx-auto w-full sm:w-1/2 rounded-xl px-5 py-4 bg-luminous-bg-secondary border border-luminous-gold-border">
                                <p className="text-center font-medium text-luminous-text-secondary text-sm sm:text-base">
                                    Aucun restaurant n&apos;est disponible
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </>
        )}

        {showWelcomeMessage && selectedRestaurant && (
            <div className="w-full mx-auto flex justify-center gap-2">
                <div className="min-h-[30px]">
                    <div className="my-5 mx-auto px-4 sm:px-6 py-4 sm:py-5 border-2 border-luminous-gold rounded-xl bg-luminous-bg-secondary">
                        <p className="text-center font-display font-medium text-luminous-gold text-sm sm:text-base whitespace-normal sm:whitespace-nowrap">
                            Le restaurant {selectedRestaurant.restaurantName} vous souhaite la bienvenue
                        </p>
                    </div>
                </div>
            </div>
        )}
    </LuminousCard>
    <style jsx>{`
        @keyframes noticeShrink {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
        }
    `}</style>
    </>
    )
}

const RestaurantRows: React.FC<{
    id: string,
    selectedRestaurantId: string,
    restaurantName: string,
    restaurantType: string,
    stars: number,
    isDemo: boolean,
    selectRestaurant: (id: string) => void,
}> = ({id, restaurantName, restaurantType, stars, isDemo, selectRestaurant, selectedRestaurantId}) => {
    const isSelected = selectedRestaurantId === id;

    return (
    <button
        type="button"
        onClick={() => selectRestaurant(id)}
        aria-pressed={isSelected}
        className="w-full sm:w-auto my-3 sm:my-4 mx-auto flex gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luminous-gold/60 rounded-xl"
    >
        <div className={`
            cursor-pointer mx-auto p-5 sm:p-6 w-full sm:min-w-[280px] rounded-xl
            border-2 transition-all duration-300
            \${isSelected
                ? "bg-luminous-gold/10 border-luminous-gold shadow-[0_8px_30px_rgba(201,162,39,0.15)]"
                : "bg-luminous-bg-card border-luminous-gold-border hover:border-luminous-gold hover:shadow-[0_4px_20px_rgba(201,162,39,0.1)]"
            }
        `}>
            <div className="flex flex-col gap-2 sm:gap-3 items-center justify-center">
                {isDemo && (
                    <span className="inline-flex items-center rounded-full bg-luminous-gold/15 px-3 py-1 text-xs font-medium text-luminous-gold">
                        Restaurant démo
                    </span>
                )}
                <h3 className={`text-lg sm:text-xl font-display font-medium \${isSelected ? "text-luminous-gold" : "text-luminous-text-primary"}`}>
                    {restaurantName}
                </h3>
                <p className={`text-sm sm:text-base \${isSelected ? "text-luminous-gold" : "text-luminous-text-secondary"}`}>
                    {restaurantType}
                </p>
                <ul className="flex gap-1 sm:gap-2">
                    {stars > 0 && stars < 7 && [...Array(stars)].map((_, i) => (
                        <li key={i} className="text-base sm:text-lg">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="#C9A227"
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                aria-hidden="true"
                            >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </button>
    )
}
