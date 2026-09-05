"use client";

import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { Home } from "@/components/Home";
import { PoolDetail } from "@/components/PoolDetail";
import { Positions } from "@/components/Positions";
import { Footer } from "@/components/Footer";
import { Intro } from "@/components/Intro";
import { TideMark } from "@/components/icons";

type View = { kind: "home" } | { kind: "pool"; id: string } | { kind: "positions" };

function App() {
  const { ready } = useStore();
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState<View>({ kind: "home" });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  if (!entered) return <Intro onEnter={() => setEntered(true)} />;

  return (
    <>
      <Nav
        onHome={() => setView({ kind: "home" })}
        onPositions={() => setView({ kind: "positions" })}
      />
      <main className="min-h-[70vh] pt-6">
        {!ready ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted">
            <TideMark width={38} height={38} className="animate-pulse-dot" />
            <p className="text-sm">loading pools…</p>
          </div>
        ) : view.kind === "pool" ? (
          <PoolDetail poolId={view.id} onBack={() => setView({ kind: "home" })} />
        ) : view.kind === "positions" ? (
          <Positions onOpenPool={(id) => setView({ kind: "pool", id })} />
        ) : (
          <Home
            onOpenPool={(id) => setView({ kind: "pool", id })}
            onPositions={() => setView({ kind: "positions" })}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
