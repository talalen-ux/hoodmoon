"use client";

import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { Ticker } from "@/components/Ticker";
import { Home } from "@/components/Home";
import { PoolDetail } from "@/components/PoolDetail";
import { Footer } from "@/components/Footer";
import { PrintMark } from "@/components/icons";

function App() {
  const { ready } = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [selected]);

  return (
    <>
      <Nav onHome={() => setSelected(null)} />
      {!selected && ready && <Ticker />}
      <main className="min-h-[70vh] pt-6">
        {!ready ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted">
            <PrintMark width={38} height={38} className="animate-pulse-dot" />
            <p className="text-sm">loading the board…</p>
          </div>
        ) : selected ? (
          <PoolDetail poolId={selected} onBack={() => setSelected(null)} />
        ) : (
          <Home onOpen={(id) => setSelected(id)} />
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
