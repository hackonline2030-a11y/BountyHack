import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { Dependencies } from "@store/dependencies";
import { reportDraftReducer } from "@modules/report-draft/core/store/report-draft.slice";
import { reportDraftsReducer } from "@modules/report-draft/core/store/report-drafts.slice";
import { registerReportDraftStepListener } from "@modules/report-draft/core/store/report-draft-step.listener";
import { registerReportDraftFetcherListeners } from "@modules/report-draft/core/store/report-draft-fetcher.listener";

const reducers = combineReducers({
  reportDraft: reportDraftReducer,
  reportDrafts: reportDraftsReducer,
});

export type AppStore = ReturnType<typeof createStore>;
export type AppState = ReturnType<typeof reducers>;
export type AppDispatch = AppStore["dispatch"];
export type AppGetState = AppStore["getState"];

export const createStore = (config: {
  initialState?: AppState;
  dependencies: Dependencies;
}) => {
  const store = configureStore({
    preloadedState: config?.initialState,
    reducer: reducers,
    devTools: true,
    middleware: (getDefaultMiddleware) => {
      const listener = createListenerMiddleware();
      registerReportDraftStepListener(listener);
      registerReportDraftFetcherListeners(listener);

      return getDefaultMiddleware({
        thunk: {
          extraArgument: config.dependencies,
        },
      }).prepend(listener.middleware);
    },
  });

  return store;
};

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
