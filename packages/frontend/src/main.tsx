import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Monitoring } from "react-scan/monitoring";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Replay } from "./replay-test.tsx";
const queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* <Monitoring apiKey="blah" params={{}} path="/" /> */}
      <Suspense
        fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-black">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-zinc-500" />
          </div>
        }
      >
        <App />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>
);
