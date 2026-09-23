"use client";

import { useSyncExternalStore } from "react";
import {
  getConnectivityServerSnapshot,
  getConnectivitySnapshot,
  subscribeConnectivity,
} from "@/lib/offline/connectivity-store";
import type { ConnectivityState } from "@/lib/offline/types";

export function useConnectivity(): ConnectivityState {
  return useSyncExternalStore(
    subscribeConnectivity,
    getConnectivitySnapshot,
    getConnectivityServerSnapshot,
  );
}
