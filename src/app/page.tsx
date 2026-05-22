import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 22px",
        gap: 18,
      }}
    >
      <p
        style={{
          color: "#9c8266",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontSize: 13,
          fontStyle: "italic",
        }}
      >
        Araçá Grill apresenta
      </p>
      <h1
        style={{
          fontSize: "clamp(40px,9vw,72px)",
          color: "#e9c69a",
          fontWeight: 500,
          fontStyle: "italic",
          margin: 0,
        }}
      >
        Nossa História
      </h1>
      <p style={{ color: "#cdb89e", fontSize: 19, maxWidth: 440 }}>
        Uma homenagem que só existe porque vocês existem juntos.
      </p>
      <Link
        href="/admin"
        style={{
          marginTop: 14,
          color: "#7a6448",
          fontSize: 14,
          letterSpacing: "0.1em",
          textDecoration: "none",
        }}
      >
        painel da equipe →
      </Link>
    </main>
  );
}
