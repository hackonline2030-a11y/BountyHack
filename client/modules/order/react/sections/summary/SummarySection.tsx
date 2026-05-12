import {useSummary, MealSummary} from "@taotask/modules/order/react/sections/summary/use-summary.hook";
import Image from "next/image";
import { Table } from 'lucide-react';
import { LuminousCard } from '@taotask/modules/order/react/components/ui/LuminousCard';
import { LuminousButton } from '@taotask/modules/order/react/components/ui/LuminousButton';

const formatMealList = (meals: MealSummary[]): string => {
    if (meals.length === 0) return '';
    return meals.map(m => m.quantity > 1 ? `${m.quantity}x ${m.title}` : m.title).join(', ');
};

const hasAlcoholicDrink = (drinks: MealSummary[]): boolean => {
    return drinks.some(d => d.requiredAge !== null && d.requiredAge >= 18);
};

export const SummarySection = () => {
    const presenter = useSummary();

    return (
    <LuminousCard className="mx-auto py-8 sm:py-12 w-full max-w-[1200px] animate-fade-in-down">
        <div className="flex flex-col mx-auto mb-5 w-full">
            <h3 className="mx-auto my-3 sm:my-5 pb-3 sm:pb-5 font-display font-medium text-luminous-text-primary text-xl sm:text-2xl uppercase text-center tracking-wide">
                Votre réservation
            </h3>
            <div className="h-1 w-16 bg-luminous-gold mx-auto mb-6" />

            {!presenter.isQrMode && (
                <div className="bg-luminous-bg-secondary border border-luminous-gold-border rounded-xl p-4 mx-auto max-w-[400px]">
                    <p className='mb-2 font-display font-medium text-center text-base sm:text-lg text-luminous-text-primary'>
                        Emplacement de la table
                    </p>
                    <div className="flex justify-center mb-2">
                        <Table className="w-8 h-8 text-luminous-gold" />
                    </div>
                    <p className="text-sm sm:text-base italic text-center text-luminous-gold">
                        {presenter.summary.table.title}
                    </p>
                </div>
            )}
        </div>

        <div className="flex flex-col mx-auto w-full max-w-75">
            <p className="mb-4 text-base sm:text-lg font-display font-medium text-center text-luminous-text-primary">
                Invités et leurs plats
            </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mx-auto my-3 w-full max-w-full sm:max-w-[85%]">
            {presenter.summary.guests.map((guest) => {
                const hasAlcohol = hasAlcoholicDrink(guest.meals.drinks);
                const hasNoMeals =
                    guest.meals.entries.length === 0 &&
                    guest.meals.mainCourses.length === 0 &&
                    guest.meals.desserts.length === 0 &&
                    guest.meals.drinks.length === 0;

                return (
                    <div key={guest.id} className="
                        relative flex flex-col justify-center items-center
                        border-2 border-luminous-gold-border hover:border-luminous-gold
                        bg-luminous-bg-card rounded-xl
                        mb-5 p-4 w-full sm:min-w-[280px] sm:basis-1/4
                        transition-all duration-200 shadow-[0_4px_20px_rgba(201,162,39,0.08)]
                    ">
                        {guest.isOrganizer && (
                            <span className="block -top-3 left-3 absolute bg-luminous-gold px-3 py-1 rounded-full font-medium text-white text-xs uppercase tracking-wider">
                                Organisateur
                            </span>
                        )}

                        <div className="mt-4 mb-3">
                            <p className="font-display font-medium text-luminous-text-primary text-lg">{guest.name}</p>
                            {guest.menuTitle ? (
                                <span className="bg-luminous-gold/20 text-luminous-gold px-2 py-0.5 rounded text-xs">
                                    {guest.menuTitle}
                                </span>
                            ) : (
                                <span className="bg-luminous-bg-secondary text-luminous-text-muted px-2 py-0.5 rounded text-xs">
                                    À la carte
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col justify-center items-center grow gap-1">
                            {hasAlcohol && guest.isOrganizer && (
                                <p className="my-2 text-center text-luminous-rose text-sm italic">
                                    Éviter l&#39;alcool car vous organisez
                                </p>
                            )}
                            {guest.meals.entries.length > 0 && (
                                <p className="text-center text-luminous-text-secondary text-sm">
                                    <span className="text-luminous-meal-entry font-medium">Entrée:</span>{' '}
                                    {formatMealList(guest.meals.entries)}
                                </p>
                            )}
                            {guest.meals.mainCourses.length > 0 && (
                                <p className="text-center text-luminous-text-secondary text-sm">
                                    <span className="text-luminous-meal-main font-medium">Plat:</span>{' '}
                                    {formatMealList(guest.meals.mainCourses)}
                                </p>
                            )}
                            {guest.meals.desserts.length > 0 && (
                                <p className="text-center text-luminous-text-secondary text-sm">
                                    <span className="text-luminous-meal-dessert font-medium">Dessert:</span>{' '}
                                    {formatMealList(guest.meals.desserts)}
                                </p>
                            )}
                            <div className={hasAlcohol ? "flex gap-2 items-center justify-center" : ""}>
                                {guest.isOrganizer && hasAlcohol && (
                                    <Image src="/danger.svg" height={18} width={18} alt="warning" />
                                )}
                                {guest.meals.drinks.length > 0 && (
                                    <p className="text-center text-luminous-text-secondary text-sm">
                                        <span className="text-luminous-meal-drink font-medium">Boisson:</span>{' '}
                                        {formatMealList(guest.meals.drinks)}
                                    </p>
                                )}
                            </div>
                            {hasNoMeals && (
                                <p className="text-center text-luminous-text-muted text-sm italic mt-2">
                                    Aucune commande
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Price Total */}
        <div className="bg-luminous-bg-secondary border-2 border-luminous-gold rounded-xl p-4 mx-auto max-w-[400px] mt-6">
            <p className="text-center font-display font-medium text-lg text-luminous-text-primary mb-3">
                Récapitulatif
            </p>

            {/* Menu breakdown */}
            {Object.entries(presenter.priceBreakdown.menusByType).map(([menuName, data]) => (
                <div key={menuName} className="flex justify-between text-sm text-luminous-text-secondary mb-1">
                    <span>{data.count}x {menuName}</span>
                    <span>{(data.count * data.price).toFixed(2)} €</span>
                </div>
            ))}

            {/* À la carte */}
            {presenter.priceBreakdown.hasAlaCarte && (
                <div className="flex justify-between text-sm text-luminous-text-secondary mb-1">
                    <span>À la carte</span>
                    <span>{presenter.priceBreakdown.alaCarteTotal.toFixed(2)} €</span>
                </div>
            )}

            <div className="border-t border-luminous-gold-border my-2"></div>

            <div className="flex justify-between">
                <span className="font-medium text-luminous-text-primary">Total estimé</span>
                <span className="text-xl font-bold text-luminous-gold">{presenter.totalPrice} €</span>
            </div>
            <p className="text-center text-xs text-luminous-text-muted mt-1 italic">
                (hors pourboire)
            </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mx-auto w-full mt-8">
            <LuminousButton
                onClick={presenter.onPrevious}
                variant="secondary"
            >
                Précédent
            </LuminousButton>
            <LuminousButton
                onClick={presenter.onNext}
                variant="primary"
            >
                Réserver
            </LuminousButton>
        </div>
    </LuminousCard>
    );
};
