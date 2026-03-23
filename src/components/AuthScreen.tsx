interface AuthScreenProps {
  readonly onSignIn: () => void;
}

export function AuthScreen({ onSignIn }: AuthScreenProps) {
  return (
    <div className="auth-screen">
      <h1>ClipSync</h1>
      <p>Cloud clipboard sync across all your devices</p>
      <button className="btn btn-primary" onClick={onSignIn}>
        Sign in with Google
      </button>
    </div>
  );
}
