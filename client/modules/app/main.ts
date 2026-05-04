import { Dependencies } from "@store/dependencies";
import { AppStore, createStore, AppState } from "@store/redux/store";

export class App {
  public dependencies: Dependencies;
  public store: AppStore;

  constructor() {

    const dependenciesRef: Dependencies = {};
    

    this.store = createStore({ dependencies: dependenciesRef });
    
    const getState = (): AppState => this.store.getState();
   
    this.dependencies = dependenciesRef;
  }
}

export const app = new App();