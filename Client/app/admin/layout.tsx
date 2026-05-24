"use client";

import React from "react";
import Session from "@/components/Session";

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Session />
      {children}
    </>
  );
}
