/**
 * Operational Transform Utility
 * Handles concurrent edits without data loss
 */

/**
 * Apply operation to text
 * @param {string} text - Current content
 * @param {object} op - { type, position, text } or { type, position, length }
 * @returns {string} New content after operation
 */

function applyOperation(text, op) {
  if (op.type === "insert") {
    return (
      text.substring(0, op.position) +
      op.text +
      text.substring(op.position)
    );
  }

  if (op.type === "delete") {
    return (
      text.substring(0, op.position) +
      text.substring(op.position + op.length)
    );
  }

  return text;
}

/**
 * Transform operation B relative to operation A
 * Answer: "If A happened first, how should B change?"
 *
 * @param {object} opA - Operation that happened first
 * @param {object} opB - Operation to transform
 * @returns {object} Transformed opB
 */

function transform(opA, opB) {
  let transformedB = { ...opB };

  // Case 1: A inserts, B inserts
  if (opA.type === "insert" && opB.type === "insert") {
    if (opA.position < transformedB.position) {
      transformedB.position += opA.text.length;
    } else if (opA.position === transformedB.position) {
      // Both insert at same position: A wins (came first)
      // B's position doesn't change, it goes after A's insertion
    }
  }

  // Case 2: A deletes, B inserts
  if (opA.type === "delete" && opB.type === "insert") {
    if (opA.position < transformedB.position) {
      transformedB.position -= Math.min(
        opA.length,
        transformedB.position - opA.position
      );
    }
  }

  // Case 3: A inserts, B deletes
  if (opA.type === "insert" && opB.type === "delete") {
    if (opA.position <= transformedB.position) {
      transformedB.position += opA.text.length;
    }
  }

  // Case 4: A deletes, B deletes
  if (opA.type === "delete" && opB.type === "delete") {
    if (opA.position < transformedB.position) {
      transformedB.position -= Math.min(
        opA.length,
        transformedB.position - opA.position
      );
    }
  }

  return transformedB;
}

export { applyOperation, transform };