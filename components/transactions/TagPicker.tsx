"use client";

import { useEffect, useState } from "react";
import { colorForTagName } from "@/lib/constants";

type TagDoc = { _id: string; name: string; color: string };

export default function TagPicker({
  kind,
  value,
  onChange,
}: {
  kind: "expense" | "income";
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [suggestions, setSuggestions] = useState<TagDoc[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch(`/api/tags?kind=${kind}`)
      .then((r) => r.json())
      .then((data) => setSuggestions(data.tags ?? []));
  }, [kind]);

  function colorFor(name: string) {
    return suggestions.find((t) => t.name.toLowerCase() === name.toLowerCase())?.color ?? colorForTagName(name);
  }

  async function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange([...value, trimmed]);
    setInput("");

    if (!suggestions.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name: trimmed, color: colorForTagName(trimmed) }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions((prev) => [...prev, data.tag]);
      }
    }
  }

  function removeTag(name: string) {
    onChange(value.filter((t) => t !== name));
  }

  const filteredSuggestions = suggestions.filter(
    (t) => !value.includes(t.name) && t.name.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div>
      <div className="tag-input flex flex-wrap gap-1.5 items-center p-2 min-h-[46px] border border-border-color rounded-xl">
        {value.map((name) => {
          const color = colorFor(name);
          return (
            <span
              key={name}
              className="tag-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: `${color}1f`, color, border: `1px solid ${color}55` }}
            >
              {name}
              <button type="button" onClick={() => removeTag(name)} className="opacity-70 hover:opacity-100">
                ×
              </button>
            </span>
          );
        })}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(input);
            } else if (e.key === "Backspace" && !input && value.length) {
              removeTag(value[value.length - 1]);
            }
          }}
          placeholder={value.length ? "" : "Add tags…"}
          className="flex-1 min-w-[90px] outline-none bg-transparent text-sm py-1"
        />
      </div>
      {input && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {filteredSuggestions.slice(0, 6).map((t) => (
            <button
              key={t._id}
              type="button"
              onClick={() => addTag(t.name)}
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${t.color}1f`, color: t.color, border: `1px solid ${t.color}55` }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
