import { Elysia } from "elysia";

export const app = new Elysia({
  prefix: "/api",
});

app.get("/health", () => ({
  success: true,
  message: "working",
}));

export default app.fetch;