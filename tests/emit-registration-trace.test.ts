import test from "node:test";
import { registerUserAccount } from "../lib/auth/user-profile.service";

test("emit registration trace", async () => {
  process.env.NOTIFICATION_RUNTIME_TRACE = "true";
  process.env.NODE_ENV = process.env.NODE_ENV || "development";

  console.log("Starting emit-registration-trace test");
  await registerUserAccount({ email: "trace-user@example.com", name: "Trace User" });
  console.log("Finished emit-registration-trace test");
});
