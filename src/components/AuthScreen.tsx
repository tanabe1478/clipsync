interface AuthScreenProps {
  readonly onSignIn: () => void;
}

export function AuthScreen({ onSignIn }: AuthScreenProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 24 }}>
      <h1>ClipSync</h1>
      <p>Cloud clipboard sync across all your devices</p>
      <button
        onClick={onSignIn}
        style={{ padding: "12px 24px", fontSize: 16, cursor: "pointer", borderRadius: 8, border: "1px solid #ccc", background: "#fff" }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
