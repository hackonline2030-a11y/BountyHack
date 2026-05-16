import { Dependencies } from "@store/dependencies";
import { createContext, useContext } from "react";

const DependenciesContext = createContext<Dependencies | null>(null);

export const DependenciesProvider: React.FC<{
  dependencies: Dependencies;
  children: React.ReactNode;
}> = ({ dependencies, children }) => (
  <DependenciesContext.Provider value={dependencies}>
    {children}
  </DependenciesContext.Provider>
);

export function useDependencies(): Dependencies {
  const ctx = useContext(DependenciesContext);
  if (ctx === null) {
    throw new Error("useDependencies must be used within DependenciesProvider");
  }
  return ctx;
}