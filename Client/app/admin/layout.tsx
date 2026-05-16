"use client";

import React from "react";
import { Provider } from "react-redux";
import { AppProvider } from "@/Helpers/AccountDialog";
import { store } from "@/app/store";
import Session from "@/components/Session";

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppProvider>
        <Session />
        {children}
      </AppProvider>
    </Provider>
  );
}
