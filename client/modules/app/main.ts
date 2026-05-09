import { Dependencies } from "@store/dependencies";
import { AppStore, createStore } from "@store/redux/store";

export class App {
  public dependencies: Dependencies;
  public store: AppStore;

  constructor() {
    const dependenciesRef: Dependencies = {};
    this.store = createStore({ dependencies: dependenciesRef });
    this.dependencies = dependenciesRef;
  }
}

export const app = new App();