import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { Dependencies } from "@store/dependencies";

const reducers = combineReducers({});

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
    middleware: (getDefaultMiddleware: any) => {
      const listener = createListenerMiddleware();

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
