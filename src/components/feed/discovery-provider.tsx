"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { DiscoveryDock } from "@/components/feed/discovery-dock";

interface Discovery {
  running: boolean;
  start: () => void;
}

const DiscoveryContext = createContext<Discovery>({ running: false, start: () => {} });

export function useDiscovery(): Discovery {
  return useContext(DiscoveryContext);
}

/**
 * Owns the discovery run for the whole app.
 *
 * It sits in the root layout rather than on the queue, because a run takes a
 * minute or two and people do not sit still for that: they open an issue, read
 * the reasoning, check what they saved. Mounted above the router, the widget
 * and its request survive every one of those moves.
 *
 * Progress itself stays inside the widget, so a stream of events does not
 * re-render the rest of the application thirty times a minute.
 */
export function DiscoveryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  const start = useCallback(() => setRunning(true), []);
  const value = useMemo(() => ({ running, start }), [running, start]);

  return (
    <DiscoveryContext.Provider value={value}>
      {children}
      <DiscoveryDock
        running={running}
        onFinished={() => {
          setRunning(false);
          // Whichever page is open now shows whatever the run found.
          router.refresh();
        }}
      />
    </DiscoveryContext.Provider>
  );
}
