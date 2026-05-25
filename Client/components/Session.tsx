"use client";

import { useEffect } from "react";
import userData from "@/controllers/userData";
import useAuth from "@/controllers/Authentication";

const Session = () => {
  const { checkSession } = useAuth();
  const { grabUserData } = userData();

  useEffect(() => {
    async function sync() {
      await checkSession();
      await grabUserData();
    }

    sync();
  }, []);

  return null;
};

export default Session;