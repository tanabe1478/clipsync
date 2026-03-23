import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ClipList } from "../../components/ClipList";
import type { Clip } from "../../lib/types";

const mockClips: readonly Clip[] = [
  {
    id: "1",
    user_id: "user-1",
    content: "First clip",
    device_name: "MacBook",
    pinned: false,
    created_at: "2026-03-24T00:00:00Z",
  },
  {
    id: "2",
    user_id: "user-1",
    content: "Second clip",
    device_name: "Windows PC",
    pinned: true,
    created_at: "2026-03-23T00:00:00Z",
  },
];

describe("ClipList", () => {
  it("renders all clips", () => {
    render(
      <ClipList clips={mockClips} onCopy={vi.fn()} onTogglePin={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("First clip")).toBeInTheDocument();
    expect(screen.getByText("Second clip")).toBeInTheDocument();
  });

  it("shows empty state when no clips", () => {
    render(
      <ClipList clips={[]} onCopy={vi.fn()} onTogglePin={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText(/no clips/i)).toBeInTheDocument();
  });
});
