import React from "react";
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import Image from 'next/image';
import { useMeals } from '@taotask/modules/order/react/sections/meals/use-meals.hook';
import { LuminousCard } from '@taotask/modules/order/react/components/ui/LuminousCard';
import { LuminousButton } from '@taotask/modules/order/react/components/ui/LuminousButton';
import { MealSelectionSummary } from '@taotask/modules/order/react/components/meals/MealSelectionSummary';
import { Check, Plus, Minus } from 'lucide-react';

const MEAL_TYPE_LABELS: Record<OrderingDomainModel.MealType, string> = {
  ENTRY: 'E',
  MAIN_COURSE: 'P',
  DESSERT: 'D',
  DRINK: 'B',
};

const formatMenuItems = (items: OrderingDomainModel.MenuItem[]): string => {
  return items
    .filter(item => item.quantity > 0)
    .map(item => `${item.quantity}${MEAL_TYPE_LABELS[item.mealType]}`)
    .join(' + ');
};

export const MealsSection = () => {
  const presenter = useMeals();

  if (!presenter.currentGuest) {
    return null;
  }

  const menuProgress = presenter.getMenuProgress(presenter.currentGuest);

  const mealTypes: Record<OrderingDomainModel.MealType, string> = {
    "ENTRY": "Entrée",
    "MAIN_COURSE": "Plat",
    "DESSERT": "Dessert",
    "DRINK": "Boisson",
  };

  const mealBadgeStyles: Record<OrderingDomainModel.MealType, string> = {
    "ENTRY": "bg-luminous-meal-entry-bg text-luminous-meal-entry",
    "MAIN_COURSE": "bg-luminous-meal-main-bg text-luminous-meal-main",
    "DESSERT": "bg-luminous-meal-dessert-bg text-luminous-meal-dessert",
    "DRINK": "bg-luminous-meal-drink-bg text-luminous-meal-drink",
  };

  const groupedMeals = {
    [OrderingDomainModel.MealType.ENTRY]: presenter.getSelectableEntries(presenter.currentGuest),
    [OrderingDomainModel.MealType.MAIN_COURSE]: presenter.getSelectableMainCourses(presenter.currentGuest),
    [OrderingDomainModel.MealType.DESSERT]: presenter.getSelectableDesserts(presenter.currentGuest),
    [OrderingDomainModel.MealType.DRINK]: presenter.getSelectableDrinks(presenter.currentGuest),
  };

  // Get selected menu's required types for filtering
  const selectedMenuRequiredTypes = presenter.selectedMenu
    ? presenter.selectedMenu.items
        .filter(item => item.quantity > 0)
        .map(item => item.mealType)
    : [];

  // Filter displayed meal types - only show required categories when a menu is selected
  const displayedMealTypes = presenter.selectedMenu
    ? Object.values(OrderingDomainModel.MealType).filter(type => selectedMenuRequiredTypes.includes(type))
    : Object.values(OrderingDomainModel.MealType);

  return (
    <LuminousCard className="mx-auto py-8 sm:py-12 w-full max-w-[1200px] animate-fade-in-down relative">
      <div className="flex flex-col mx-auto mb-5 w-full">
        <h3 className="mx-auto my-3 font-display font-medium text-luminous-text-primary text-xl sm:text-2xl text-center tracking-wide">
          Commande de {presenter.currentGuest.firstName} {presenter.currentGuest.lastName}
        </h3>
        <p className="text-center text-luminous-text-secondary text-sm mb-2">
          Invité {presenter.currentGuestIndex + 1}/{presenter.totalGuests}
        </p>
        {menuProgress && (
          <p className="text-center text-luminous-text-muted text-sm mb-4">
            {menuProgress.selected}/{menuProgress.total} selections
          </p>
        )}
        <div className="h-1 w-16 bg-luminous-gold mx-auto my-4" />
      </div>

      {/* Menu Selection Section */}
      {presenter.menusStatus === 'success' && presenter.menus.length > 0 && (
        <div className="mb-10">
          <h4 className="text-lg font-display font-medium text-luminous-text-primary mb-4 uppercase tracking-wide">
            Nos Menus
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {presenter.menus.map((menu) => {
              const isSelected = presenter.selectedMenuId === menu.id;
              return (
                <div
                  key={menu.id}
                  onClick={() => presenter.onSelectMenu(isSelected ? null : menu.id)}
                  className="cursor-pointer"
                >
                  <div className={`relative rounded-xl overflow-hidden border-2 ${isSelected ? 'border-luminous-gold' : 'border-luminous-gold-border'} bg-luminous-bg-card shadow-[0_4px_20px_rgba(201,162,39,0.08)] hover:shadow-[0_8px_30px_rgba(201,162,39,0.12)] transition-all duration-300`}>
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 z-10 w-7 h-7 bg-luminous-sage rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* Menu image */}
                    {menu.imageUrl && (
                      <Image
                        width={400}
                        height={200}
                        src={menu.imageUrl}
                        alt={menu.title}
                        className="w-full h-[140px] object-cover"
                      />
                    )}

                    {/* Menu info */}
                    <div className="p-4">
                      <h5 className="text-base font-semibold text-luminous-text-primary mb-1">
                        {menu.title}
                      </h5>
                      <p className="text-sm text-luminous-text-secondary mb-2">
                        {menu.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-luminous-gold-muted">
                          {formatMenuItems(menu.items)}
                        </span>
                        <span className="text-lg font-bold text-luminous-gold">
                          {menu.price} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-luminous-gold-border"></div>
            <span className="px-4 text-sm text-luminous-text-muted italic">
              {presenter.selectedMenu ? `Menu : ${presenter.selectedMenu.title}` : 'À la carte'}
            </span>
            <div className="flex-1 h-px bg-luminous-gold-border"></div>
          </div>
        </div>
      )}

      {/* Vertical scroll sections for meal categories */}
      <div className="flex flex-col gap-8 mb-8">
        {displayedMealTypes.map((type) => {
          const meals = groupedMeals[type];
          if (meals.length === 0) return null;

          const maxQty = presenter.getMaxQuantityForType(presenter.currentGuest, type);
          const totalSelected = presenter.getTotalQuantityForType(presenter.currentGuest, type);
          const canAddMore = presenter.canAddMoreOfType(presenter.currentGuest, type);

          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-display font-medium text-luminous-text-primary uppercase tracking-wide">
                  {mealTypes[type]}s
                </h4>
                {maxQty > 0 && (
                  <span className={`text-sm ${totalSelected >= maxQty ? 'text-luminous-sage' : 'text-luminous-text-muted'}`}>
                    {totalSelected}/{maxQty} sélectionné{totalSelected > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory">
                {meals.map((meal) => {
                  const isSelected = presenter.isMealSelected(presenter.currentGuest, meal.id, type);
                  const mealQuantity = presenter.getMealQuantity(presenter.currentGuest, meal.id, type);
                  const isAgeRestricted = Boolean(
                    meal.requiredAge && meal.requiredAge > presenter.currentGuest.age
                  );
                  const isDisabled = isAgeRestricted || (!isSelected && !canAddMore);

                  const handleMealSelect = () => {
                    if (!isDisabled || isSelected) {
                      presenter.onMealSelected(String(presenter.currentGuest.id), meal.id, type);
                    }
                  };

                  const isSelectable = !isDisabled || isSelected;

                  return (
                    <div
                      key={meal.id}
                      role="button"
                      tabIndex={isSelectable ? 0 : -1}
                      onClick={handleMealSelect}
                      onKeyDown={(event) => {
                        if (!isSelectable) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleMealSelect();
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-disabled={!isSelectable}
                      className={`flex-shrink-0 w-[140px] sm:w-[180px] snap-start text-left ${isSelectable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luminous-gold/60 rounded-xl`}
                    >
                      <div className={`relative rounded-xl overflow-hidden border-2 ${isSelected ? 'border-luminous-gold' : 'border-luminous-gold-border'} bg-luminous-bg-card shadow-[0_4px_20px_rgba(201,162,39,0.08)] hover:shadow-[0_8px_30px_rgba(201,162,39,0.12)] transition-all duration-300`}>
                        {/* Meal type badge */}
                        <span className={`absolute top-2 left-2 z-10 ${mealBadgeStyles[meal.type]} px-2 py-0.5 rounded-full text-xs font-medium`}>
                          {mealTypes[meal.type]}
                        </span>

                        {/* Selected checkmark with quantity */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-luminous-sage rounded-full flex items-center justify-center">
                            {mealQuantity > 1 ? (
                              <span className="text-xs font-bold text-white">{mealQuantity}</span>
                            ) : (
                              <Check className="w-4 h-4 text-white" aria-hidden="true" />
                            )}
                          </div>
                        )}

                        {/* Meal image */}
                        <Image
                          width={200}
                          height={200}
                          src={meal.imageUrl}
                          alt={meal.title}
                          className="w-full h-[120px] sm:h-[150px] object-cover"
                        />

                        {/* Meal info */}
                        <div className="p-3">
                          <h5 className="text-sm font-medium text-luminous-text-primary text-center truncate">
                            {meal.title}
                          </h5>
                          <p className="text-sm font-semibold text-luminous-gold text-center mt-1">
                            {meal.price} €
                          </p>
                          {meal.requiredAge && (
                            <p className={`text-xs text-center mt-1 ${isAgeRestricted ? 'text-luminous-rose' : 'text-luminous-text-muted'}`}>
                              {meal.requiredAge}+ ans requis
                            </p>
                          )}
                          {/* Quantity controls - only show when selected */}
                          {isSelected && (
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  presenter.decrementQuantity(String(presenter.currentGuest.id), meal.id, type);
                                }}
                                disabled={mealQuantity <= 1}
                                className={`w-7 h-7 rounded-full bg-luminous-bg-secondary border border-luminous-gold-border flex items-center justify-center transition-colors ${mealQuantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-luminous-gold/20'}`}
                              >
                                <Minus className="w-4 h-4 text-luminous-gold" />
                              </button>
                              <span className="text-sm font-bold text-luminous-text-primary min-w-[24px] text-center">
                                {mealQuantity}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  presenter.incrementQuantity(String(presenter.currentGuest.id), meal.id, type);
                                }}
                                disabled={!canAddMore}
                                className={`w-7 h-7 rounded-full bg-luminous-bg-secondary border border-luminous-gold-border flex items-center justify-center transition-colors ${!canAddMore ? 'opacity-50 cursor-not-allowed' : 'hover:bg-luminous-gold/20'}`}
                              >
                                <Plus className="w-4 h-4 text-luminous-gold" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection summary */}
      <MealSelectionSummary guest={presenter.currentGuest} meals={presenter.meals} />

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 mx-auto w-full mt-8">
        {!presenter.isFirstGuest && (
          <LuminousButton
            onClick={presenter.onPreviousGuest}
            variant="secondary"
          >
            Invité précédent
          </LuminousButton>
        )}

        {presenter.currentGuestIndex === 0 && (
          <LuminousButton
            onClick={presenter.onPrevious}
            variant="secondary"
          >
            Précédent
          </LuminousButton>
        )}

        <LuminousButton
          onClick={presenter.onSkip}
          variant="destructive"
        >
          Passer les commandes
        </LuminousButton>

        {!presenter.isLastGuest ? (
          <LuminousButton
            onClick={presenter.onNextGuest}
            variant="success"
          >
            Invité suivant
          </LuminousButton>
        ) : (
          <LuminousButton
            onClick={presenter.onNext}
            variant="success"
          >
            Suivant
          </LuminousButton>
        )}
      </div>
    </LuminousCard>
  );
};
