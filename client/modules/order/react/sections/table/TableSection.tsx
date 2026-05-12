import { useTable } from '@taotask/modules/order/react/sections/table/use-table.hook';
import { LuminousCard } from '@taotask/modules/order/react/components/ui/LuminousCard';
import { LuminousButton } from '@taotask/modules/order/react/components/ui/LuminousButton';

export const TableSection = () => {
    const presenter = useTable();

    return (
    <LuminousCard className="mx-auto py-8 sm:py-12 w-full max-w-[1200px] animate-fade-in-down">
        <div className="mx-auto mb-8 w-full flex flex-col">
            <h3 className="mx-auto my-3 text-xl sm:text-2xl font-display font-medium text-luminous-text-primary text-center">
                Choix de votre table
            </h3>
            <div className="h-1 w-16 bg-luminous-gold mx-auto my-4" />
        </div>
        <div className="flex gap-4 justify-center items-center flex-wrap">
            {presenter.availableTables.length > 0
            && presenter.availableTables.map((table: any) => (
                <div key={table.id} className="w-full sm:w-auto">
                    <TableCard
                        title={table.title}
                        capacity={table.capacity}
                        isSelected={presenter.assignTableId === table.id}
                        onSelect={() => presenter.assignTable(table.id)}
                    />
                </div>
            ))}
        </div>
        <div className="w-full mx-auto flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <LuminousButton
                onClick={presenter.onPrevious}
                variant="secondary"
            >
                Précédent
            </LuminousButton>
            <LuminousButton
                onClick={presenter.onNext}
                disabled={presenter.isSubmittable === false}
                variant="success"
            >
                Suivant
            </LuminousButton>
        </div>
    </LuminousCard>
    )
}

export const TableCard: React.FC<{
    title: string,
    capacity: number,
    isSelected: boolean,
    onSelect: () => void,
}> = ({title, capacity, isSelected, onSelect}) => {

    return (
    <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className="w-full sm:w-auto my-3 sm:my-4 mx-auto flex gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luminous-gold/60 rounded-xl"
    >
        <div className={`
            cursor-pointer mx-auto p-5 sm:p-6 w-full sm:min-w-[280px] rounded-xl
            border-2 transition-all duration-300
            ${isSelected
                ? "bg-luminous-gold/10 border-luminous-gold shadow-[0_8px_30px_rgba(201,162,39,0.15)]"
                : "bg-luminous-bg-card border-luminous-gold-border hover:border-luminous-gold hover:shadow-[0_4px_20px_rgba(201,162,39,0.1)]"
            }
        `}>
            <div className="flex flex-col gap-3 items-center justify-center">
                <h3 className={`text-lg sm:text-xl font-display font-medium ${isSelected ? "text-luminous-gold" : "text-luminous-text-primary"}`}>
                    {title}
                </h3>
                <ul className="flex gap-2">
                    {capacity ? [...Array(capacity)].map((_, i) => (
                        <li key={i}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={isSelected ? "#C9A227" : "#2D2926"}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="8" r="5"/>
                                <path d="M20 21a8 8 0 0 0-16 0"/>
                            </svg>
                        </li>
                    )) : null}
                </ul>
                <span className={`text-sm ${isSelected ? "text-luminous-gold" : "text-luminous-text-secondary"}`}>
                    {capacity} {capacity > 1 ? 'places' : 'place'}
                </span>
            </div>
        </div>
    </button>
    )
}
