"use client";
import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { app } from "@modules/app/main";
import { DependenciesProvider } from "@/modules/app/nextjs/DependencyProvider";
import { SessionKeepAlive } from "@modules/auth/nextjs/SessionKeepAlive";

export const AppWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ReduxProvider store={app.store}>
    <DependenciesProvider dependencies={app.dependencies}>
      <SessionKeepAlive />
      {children}
    </DependenciesProvider>
    </ReduxProvider>;
};
