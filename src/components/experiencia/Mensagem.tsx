export default function MensagemTela({
  titulo,
  texto,
}: {
  titulo?: string;
  texto: string;
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#080503",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        gap: 18,
      }}
    >
      {titulo && (
        <h1
          style={{
            fontFamily: "var(--font-cormorant),serif",
            fontStyle: "italic",
            color: "#e9c69a",
            fontSize: "clamp(30px,7vw,52px)",
            fontWeight: 500,
            margin: 0,
          }}
        >
          {titulo}
        </h1>
      )}
      <p
        style={{
          fontFamily: "var(--font-cormorant),serif",
          color: "#cdb89e",
          fontSize: "clamp(20px,4.6vw,26px)",
          lineHeight: 1.5,
          maxWidth: 480,
          margin: 0,
        }}
      >
        {texto}
      </p>
    </main>
  );
}
