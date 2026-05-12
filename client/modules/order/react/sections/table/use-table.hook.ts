import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { orderingSlice } from "@taotask/modules/order/core/store/ordering.slice";
import { chooseTable } from "@taotask/modules/order/core/useCase/choose-table.usecase";
import { invariant } from "@taotask/modules/shared/invariant";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@taotask/modules/store/store";
import { AppState } from "@taotask/modules/store/store";

export const useTable = () => {

    function assignTable(tableId: string){
        setAssignTableId(tableId);
    }

    function onNext(){
        invariant(assignTableId !== null, "Assign table id must be set");
        dispatch(chooseTable(assignTableId!));
    }

    function onPrevious(){
        dispatch(orderingSlice.actions.setStep(OrderingDomainModel.OrderingStep.MEALS_PREVIEW))
    }

    function isSubmittable(){
        return assignTableId !== null;
    }
    const dispatch = useAppDispatch();
    const [assignTableId, setAssignTableId] = useState<string | null>(null);
    const availableTables: OrderingDomainModel.Table[] = useSelector((state: AppState) => state.ordering.availableTables.data);
 
    return {
        assignTableId,
        availableTables,
        assignTable,
        onNext,
        onPrevious,
        isSubmittable: isSubmittable()
    }
};