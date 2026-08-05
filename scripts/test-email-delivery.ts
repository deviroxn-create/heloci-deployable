import { registerUserAccount } from "@/lib/auth/user-profile.service";
import { prisma } from "@/lib/prisma/client";

/**
 * K1 EMAIL DELIVERY CERTIFICATION
 * 
 * Registers a user with the verified Resend email address
 * and verifies that the notification pipeline successfully
 * delivers the registration email.
 */
async function main() {
  console.log("[TEST] Starting email delivery certification...");

  try {
    // Register with the verified email (Resend test mode requires this)
    const user = await registerUserAccount({
      email: "petkeyz8@gmail.com",
      name: "Email Delivery Test"
    });

    console.log("[TEST] User registered:", { userId: user.id, email: user.email, name: user.name });

    // Wait for the domain event to be processed through the notification pipeline
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check notification logs to verify delivery
    const logs = await prisma.notificationLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log("\n[TEST] Notification logs found:", logs.length);
    let emailDelivered = false;
    
    logs.forEach(log => {
      console.log(`[LOG] Event: ${log.eventName}`);
      console.log(`      Channel: ${log.channel}`);
      console.log(`      Status: ${log.deliveryStatus}`);
      console.log(`      Recipient: ${log.recipient}`);
      console.log(`      Error: ${log.errorMessage || "none"}`);
      console.log("");

      if (log.channel === "email" && log.deliveryStatus === "SENT") {
        emailDelivered = true;
      }
    });

    if (emailDelivered) {
      console.log("✅ SUCCESS: Email was successfully delivered via Resend");
      process.exit(0);
    } else {
      console.log("❌ FAILURE: Email was not delivered");
      process.exit(1);
    }

  } catch (error) {
    console.error("[TEST] Error:", error);
    process.exit(1);
  }
}

main();
