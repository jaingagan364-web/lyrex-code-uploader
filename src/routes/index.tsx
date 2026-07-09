import { createFileRoute } from "@tanstack/react-router";
import FebilyLandingPage from "@/components/FebilyLandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Febily — AI Receptionists for Salons & Barber Shops" },
      {
        name: "description",
        content:
          "Febily AI receptionists answer calls, schedule appointments, and support your customers 24/7.",
      },
      { property: "og:title", content: "Febily — AI Receptionists" },
      {
        property: "og:description",
        content:
          "24/7 AI receptionists that answer calls and book appointments for salons and barber shops.",
      },
    ],
  }),
  component: FebilyLandingPage,
});
