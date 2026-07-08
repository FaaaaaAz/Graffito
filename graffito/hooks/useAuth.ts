"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/Auth/AuthProvider";

export function useAuth() {
  return useContext(AuthContext);
}
