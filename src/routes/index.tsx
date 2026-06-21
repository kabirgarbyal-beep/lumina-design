import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier Noir — Luxury Interior Architecture" },
      { name: "description", content: "Atelier Noir designs cinematic interiors and architectural spaces for collectors, hoteliers and discerning homeowners." },
      { property: "og:title", content: "Atelier Noir — Luxury Interior Architecture" },
      { property: "og:description", content: "Cinematic luxury interior design studio." },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/atelier/index.html");
    }
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <iframe
        src="/atelier/index.html"
        title="Atelier Noir"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
    </div>
  );
}
