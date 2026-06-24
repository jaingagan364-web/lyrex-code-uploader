import { createFileRoute } from "@tanstack/react-router";
import LyrexLandingPage from "@/components/LyrexLandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lyrex — AI Receptionists for Salons & Barber Shops" },
      {
        name: "description",
        content:
          "Lyrex AI receptionists answer calls, schedule appointments, and support your customers 24/7.",
      },
      { property: "og:title", content: "Lyrex — AI Receptionists" },
      {
        property: "og:description",
        content:
          "24/7 AI receptionists that answer calls and book appointments for salons and barber shops.",
      },
    ],
  }),
  component: LyrexLandingPage,
});
