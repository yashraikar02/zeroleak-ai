import React from "react";
import { getEntityStyle } from "./utils";

/**
 * Safely slices plain text into non-PII strings and highlighted PII spans.
 * Renders ONLY plain React text nodes - NEVER dangerouslySetInnerHTML!
 */
export function renderHighlightedText(text, entities, hoveredPlaceholder, onHover) {
  if (!text) return null;
  if (!entities || entities.length === 0) return text;

  // Filter valid entities with positive offsets or string match
  const validEntities = entities
    .map((ent, idx) => {
      let start = ent.start;
      let end = ent.end;
      // Fallback to substring matching if offsets are not aligned
      if (typeof start !== "number" || typeof end !== "number" || text.substring(start, end) !== ent.original) {
        const found = text.indexOf(ent.original);
        if (found !== -1) {
          start = found;
          end = found + ent.original.length;
        }
      }
      return {
        ...ent,
        id: `ent-${idx}-${ent.placeholder}`,
        start,
        end,
      };
    })
    .filter(e => typeof e.start === "number" && e.start >= 0 && e.end > e.start)
    .sort((a, b) => a.start - b.start);

  if (validEntities.length === 0) return text;

  const elements = [];
  let lastIndex = 0;

  validEntities.forEach((ent, i) => {
    // If there is an overlap with previous, skip or adjust
    if (ent.start < lastIndex) return;

    // Normal text before entity
    if (ent.start > lastIndex) {
      elements.push(
        <React.Fragment key={`text-${lastIndex}`}>
          {text.substring(lastIndex, ent.start)}
        </React.Fragment>
      );
    }

    const style = getEntityStyle(ent.type);
    const isHovered = hoveredPlaceholder && hoveredPlaceholder === ent.placeholder;

    // Entity span
    elements.push(
      <span
        key={ent.id}
        onMouseEnter={() => onHover && onHover(ent.placeholder)}
        onMouseLeave={() => onHover && onHover(null)}
        style={{
          backgroundColor: isHovered ? style.border + "30" : style.bg,
          borderBottom: `2px solid ${style.border}`,
          color: style.text,
        }}
        className={`px-1.5 py-0.5 rounded transition-all duration-150 inline cursor-pointer select-text font-medium text-[13px] ${
          isHovered ? "ring-1 ring-primary bg-primary/20" : ""
        }`}
        title={`${ent.type} (${ent.action}): ${ent.placeholder}`}
      >
        {text.substring(ent.start, ent.end)}
      </span>
    );

    lastIndex = ent.end;
  });

  // Remaining trailing text
  if (lastIndex < text.length) {
    elements.push(
      <React.Fragment key={`text-tail-${lastIndex}`}>
        {text.substring(lastIndex)}
      </React.Fragment>
    );
  }

  return elements;
}

/**
 * Safely renders outbound sanitized text with placeholders highlighted as chips.
 * Renders purely as React text nodes.
 */
export function renderSanitizedText(sanitizedText, entities, hoveredPlaceholder, onHover) {
  if (!sanitizedText) return null;
  if (!entities || entities.length === 0) return sanitizedText;

  // Split text by placeholder tokens like <PERSON_1>, <AADHAAR_1>, etc.
  const regex = /(<[A-Z_]+_\d+>)/g;
  const parts = sanitizedText.split(regex);

  return parts.map((part, index) => {
    const matchEntity = entities.find(e => e.placeholder === part);
    if (matchEntity) {
      const style = getEntityStyle(matchEntity.type);
      const isHovered = hoveredPlaceholder && hoveredPlaceholder === part;

      return (
        <span
          key={`sanitized-${index}-${part}`}
          onMouseEnter={() => onHover && onHover(part)}
          onMouseLeave={() => onHover && onHover(null)}
          className={`inline-block font-mono font-medium text-[12px] px-2 py-0.5 mx-0.5 my-0.5 rounded border cursor-pointer transition-all duration-150 ${style.chip} ${
            isHovered ? "ring-1 ring-primary scale-[1.02]" : ""
          }`}
          title={`${matchEntity.type} masked with ${part}`}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={`txt-${index}`}>{part}</React.Fragment>;
  });
}

/**
 * Safely renders the final reinserted response with restored values highlighted.
 */
export function renderRestoredText(finalText, entities, hoveredPlaceholder, onHover) {
  if (!finalText) return null;
  if (!entities || entities.length === 0) return finalText;

  // Identify restored values
  const activeEntities = entities
    .filter(e => e.returned_by_llm && e.action === "masked" && e.original)
    .sort((a, b) => b.original.length - a.original.length);

  if (activeEntities.length === 0) return finalText;

  // Build a regex matching any of the original strings
  const escaped = activeEntities.map(e => e.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = finalText.split(pattern);

  return parts.map((part, idx) => {
    const matched = activeEntities.find(e => e.original === part);
    if (matched) {
      const style = getEntityStyle(matched.type);
      const isHovered = hoveredPlaceholder && hoveredPlaceholder === matched.placeholder;

      return (
        <span
          key={`restored-${idx}-${matched.placeholder}`}
          onMouseEnter={() => onHover && onHover(matched.placeholder)}
          onMouseLeave={() => onHover && onHover(null)}
          style={{
            backgroundColor: isHovered ? style.border + "30" : style.bg,
            borderBottom: `2px solid ${style.border}`,
            color: style.text,
          }}
          className={`px-1.5 py-0.5 rounded transition-all duration-150 inline font-medium text-[13px] cursor-pointer ${
            isHovered ? "ring-1 ring-primary bg-primary/20" : ""
          }`}
          title={`Restored from ${matched.placeholder} (${matched.type})`}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={`norm-${idx}`}>{part}</React.Fragment>;
  });
}
