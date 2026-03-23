import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AuthScreen } from "../../components/AuthScreen";

describe("AuthScreen", () => {
  it("renders sign in button", () => {
    render(<AuthScreen onSignIn={vi.fn()} />);
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument();
  });

  it("calls onSignIn when button is clicked", () => {
    const onSignIn = vi.fn();
    render(<AuthScreen onSignIn={onSignIn} />);
    fireEvent.click(screen.getByRole("button", { name: /sign in with google/i }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("renders app title", () => {
    render(<AuthScreen onSignIn={vi.fn()} />);
    expect(screen.getByText("ClipSync")).toBeInTheDocument();
  });
});
