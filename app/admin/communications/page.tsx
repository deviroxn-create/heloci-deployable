import { redirect } from "next/navigation";

export default async function CommunicationsPage() {
  redirect("/admin/communication/delivery");
}
