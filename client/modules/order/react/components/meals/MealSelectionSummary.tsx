import React from 'react';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { Check, Minus } from 'lucide-react';

interface MealSelectionSummaryProps {
  guest: OrderingDomainModel.Guest;
  meals: OrderingDomainModel.Meal[];
}

export const MealSelectionSummary: React.FC<MealSelectionSummaryProps> = ({ guest, meals }) => {
  const getMealById = (id: string | null) => {
    if (!id) return null;
    return meals.find(m => m.id === id);
  };

  const formatSelections = (selections: OrderingDomainModel.MealSelection[]) => {
    if (selections.length === 0) return null;
    return selections.map(s => {
      const meal = getMealById(s.mealId);
      if (!meal) return null;
      return { meal, quantity: s.quantity };
    }).filter(Boolean) as { meal: OrderingDomainModel.Meal; quantity: number }[];
  };

  const entries = formatSelections(guest.meals.entries);
  const mainCourses = formatSelections(guest.meals.mainCourses);
  const desserts = formatSelections(guest.meals.desserts);
  const drinks = formatSelections(guest.meals.drinks);

  const renderSelections = (
    selections: { meal: OrderingDomainModel.Meal; quantity: number }[] | null,
    label: string,
    colorClass: string
  ) => (
    <div className="flex items-center gap-1 flex-wrap">
      <span className={`${colorClass} font-medium`}>{label}:</span>
      {selections && selections.length > 0 ? (
        <>
          <Check className="w-3 h-3 text-luminous-sage" />
          <span className="text-luminous-text-secondary">
            {selections.map((s, i) => (
              <span key={s.meal.id}>
                {i > 0 && ', '}
                {s.quantity > 1 ? `${s.quantity}x ` : ''}{s.meal.title}
              </span>
            ))}
          </span>
        </>
      ) : (
        <>
          <Minus className="w-3 h-3 text-luminous-text-muted" />
          <span className="text-luminous-text-muted">—</span>
        </>
      )}
    </div>
  );

  return (
    <div className="sticky bottom-0 bg-luminous-bg-card border-t-2 border-luminous-gold-border p-4 rounded-t-xl shadow-lg">
      <p className="text-sm font-medium text-luminous-text-primary mb-2">
        {guest.firstName} {guest.lastName}
      </p>
      <div className="flex flex-wrap gap-3 text-xs">
        {renderSelections(entries, 'Entrée', 'text-luminous-meal-entry')}
        {renderSelections(mainCourses, 'Plat', 'text-luminous-meal-main')}
        {renderSelections(desserts, 'Dessert', 'text-luminous-meal-dessert')}
        {renderSelections(drinks, 'Boisson', 'text-luminous-meal-drink')}
      </div>
    </div>
  );
};
