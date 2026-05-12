"use client";
import React from "react";
import { useSelector } from "react-redux";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { GuestSection } from "@taotask/modules/order/react/sections/guest/GuestSection";
import { RestaurantSection } from "../../sections/restaurant/RestaurantSection";
import { useOrderPage } from "@taotask/modules/order/react/pages/order/use-order-page";
import { AppState } from "@taotask/modules/store/store";
import { MealsSection } from "@taotask/modules/order/react/sections/meals/MealsSection";
import { TableSection } from "@taotask/modules/order/react/sections/table/TableSection";
import { SummarySection } from "@taotask/modules/order/react/sections/summary/SummarySection";
import { ReservedSection } from "@taotask/modules/order/react/sections/reserved/ReservedSection";
import { ProgressBar } from "@taotask/modules/order/react/components/progress/ProgressBar";
import { MealsPreviewSection } from "@taotask/modules/order/react/sections/meals-preview/MealsPreviewSection";
import { QrGuestSection } from "@taotask/modules/order/react/sections/qr-guests/QrGuestSection";
import { ExistingOrderSection } from "@taotask/modules/order/react/sections/existing-order/ExistingOrderSection";

export interface OrderPageProps {
  restaurantId?: string;
  tableId?: string;
  qrRestaurantId?: string;
}

export const OrderPage: React.FC<OrderPageProps> = ({ restaurantId, tableId, qrRestaurantId }) => {
  const presenter = useOrderPage({ restaurantId, tableId, qrRestaurantId });
  const step = useSelector((state: AppState) => state.ordering.step);
  const qrError = useSelector((state: AppState) => state.ordering.qrError);

  const restaurantName = presenter.restaurantList.restaurants.find(
    r => String(r.id) === String(presenter.restaurantList.restaurantId)
  )?.restaurantName || '';

  return (
    <main className="flex flex-col" ref={presenter.animText}>
      <h1 className="sr-only">Réservation</h1>
      <div className="pt-5 pb-2 px-4 sm:px-6 lg:px-8 w-full content-section-minh bg-gradient-to-b from-luminous-bg-primary to-luminous-bg-secondary flex flex-col gap-6 sm:gap-8 lg:gap-10">
        {/* Progress Bar - show for all steps except RESERVED */}
        {step !== OrderingDomainModel.OrderingStep.RESERVED && (
          <ProgressBar step={step} isQrMode={presenter.isQrMode} />
        )}

        {/* QR Error display */}
        {qrError && (
          <div className="mx-auto max-w-md p-4 bg-luminous-rose/10 border border-luminous-rose rounded-lg text-luminous-rose text-center">
            {qrError}
          </div>
        )}

        {!presenter.isTerminalMode && !presenter.isQrMode &&
          (step === OrderingDomainModel.OrderingStep.RESTAURANT ||
            step === OrderingDomainModel.OrderingStep.MEALS_PREVIEW) && (
            <RestaurantSection
              restaurantList={presenter.restaurantList}
              selectRestaurant={presenter.selectRestaurant}
              step={step}
              restaurantNotice={presenter.restaurantNotice}
              restaurantsStatus={presenter.restaurantsStatus}
            />
          )}

        {presenter.restaurantList.restaurantId &&
          step === OrderingDomainModel.OrderingStep.MEALS_PREVIEW && (
            <MealsPreviewSection
              meals={presenter.meals}
              restaurantName={restaurantName}
            />
          )}

        {presenter.restaurantList.restaurantId &&
          step === OrderingDomainModel.OrderingStep.TABLE && <TableSection />}

        {/* QR Guest Section */}
        {step === OrderingDomainModel.OrderingStep.QR_GUESTS && <QrGuestSection />}

        {/* Existing Order Section */}
        {step === OrderingDomainModel.OrderingStep.EXISTING_ORDER && <ExistingOrderSection />}

        {presenter.restaurantList.restaurantId &&
          step === OrderingDomainModel.OrderingStep.GUESTS && (
            <GuestSection
              restaurantList={presenter.restaurantList}
              meals={presenter.meals}
            />
          )}

        {presenter.restaurantList.restaurantId &&
          step === OrderingDomainModel.OrderingStep.MEALS && <MealsSection />}

        {presenter.restaurantList.restaurantId &&
          step === OrderingDomainModel.OrderingStep.SUMMARY && <SummarySection />}

        {presenter.restaurantList.restaurantId &&
          step === OrderingDomainModel.OrderingStep.RESERVED && <ReservedSection />}
      </div>
      <div ref={presenter.bottomRef}></div>
    </main>
  );
};
