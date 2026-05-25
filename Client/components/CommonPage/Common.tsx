"use client";

import React, { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Menubar from "@/components/Mobile-Interface/Menubar";
import Navbar from "@/components/Navbar";
import Cart from "../ProductUi/Cart";
import Favourite from "../ProductUi/Favourite";
import Session from "../Session";

interface CommonProps {
  Component: React.ComponentType;
}

const Common: React.FC<CommonProps> = ({ Component }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Session />
      <main className="min-h-screen w-screen flex items-center flex-col overflow-x-hidden">
        <Navbar />
        <Cart />
        <Favourite />
        <Menubar />
        <Component />
        <Footer />
      </main>
    </>
  );
};

export default Common;