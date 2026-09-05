import { notFound } from "next/navigation";
import TestComposerPage from "@/components/test-composer-page";

export default function TestComposerRoute() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <TestComposerPage />;
}
