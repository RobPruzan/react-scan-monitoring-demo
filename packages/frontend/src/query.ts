import { App } from "backend";
import { treaty } from "@elysiajs/eden";

// @ts-expect-error
export const app = treaty<App>("localhost:8080");
