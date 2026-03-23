import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ClipItem } from "../../components/ClipItem";
import type { Clip } from "../../lib/types";

const mockClip: Clip = {
  id: "1",
  user_id: "user-1",
  content: "Hello World",
  device_name: "MacBook Pro",
  pinned: false,
  created_at: "2026-03-24T12:00:00Z",
};

describe("ClipItem", () => {
  it("renders clip content", () => {
    render(
      <ClipItem clip={mockClip} onCopy={vi.fn()} onTogglePin={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders device name", () => {
    render(
      <ClipItem clip={mockClip} onCopy={vi.fn()} onTogglePin={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText(/MacBook Pro/)).toBeInTheDocument();
  });

  it("calls onCopy when clip content is clicked", () => {
    const onCopy = vi.fn();
    render(
      <ClipItem clip={mockClip} onCopy={onCopy} onTogglePin={vi.fn()} onDelete={vi.fn()} />,
    );
    fireEvent.click(screen.getByText("Hello World"));
    expect(onCopy).toHaveBeenCalledWith(mockClip);
  });

  it("calls onTogglePin when pin button is clicked", () => {
    const onTogglePin = vi.fn();
    render(
      <ClipItem clip={mockClip} onCopy={vi.fn()} onTogglePin={onTogglePin} onDelete={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /pin/i }));
    expect(onTogglePin).toHaveBeenCalledWith("1");
  });

  it("shows pinned state", () => {
    const pinnedClip = { ...mockClip, pinned: true };
    render(
      <ClipItem clip={pinnedClip} onCopy={vi.fn()} onTogglePin={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /unpin/i })).toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <ClipItem clip={mockClip} onCopy={vi.fn()} onTogglePin={vi.fn()} onDelete={onDelete} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
