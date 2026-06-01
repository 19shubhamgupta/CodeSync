/**
 * Operational Transform helpers for the client.
 */

export const calculateOperations = (oldText, newText) => {
  if (oldText === newText) {
    return [];
  }

  let start = 0;
  while (
    start < oldText.length &&
    start < newText.length &&
    oldText[start] === newText[start]
  ) {
    start += 1;
  }

  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (
    oldEnd > start &&
    newEnd > start &&
    oldText[oldEnd - 1] === newText[newEnd - 1]
  ) {
    oldEnd -= 1;
    newEnd -= 1;
  }

  const deletedText = oldText.substring(start, oldEnd);
  const insertedText = newText.substring(start, newEnd);

  if (deletedText.length === 0 && insertedText.length > 0) {
    return [
      {
        type: "insert",
        position: start,
        text: insertedText,
      },
    ];
  }

  if (deletedText.length > 0 && insertedText.length === 0) {
    return [
      {
        type: "delete",
        position: start,
        length: deletedText.length,
      },
    ];
  }

  const ops = [];
  if (deletedText.length > 0) {
    ops.push({
      type: "delete",
      position: start,
      length: deletedText.length,
    });
  }
  if (insertedText.length > 0) {
    ops.push({
      type: "insert",
      position: start,
      text: insertedText,
    });
  }

  return ops;
};

export const calculateOperation = (oldText, newText) => {
  const ops = calculateOperations(oldText, newText);
  return ops.length > 0 ? ops[0] : null;
};

export const applyOperation = (text, op) => {
  if (!op) {
    return text;
  }

  if (op.type === "insert") {
    return text.slice(0, op.position) + op.text + text.slice(op.position);
  }

  if (op.type === "delete") {
    return text.slice(0, op.position) + text.slice(op.position + op.length);
  }

  return text;
};

export const transform = (opA, opB) => {
  const transformedB = { ...opB };

  if (opA.type === "insert" && opB.type === "insert") {
    if (opA.position < transformedB.position) {
      transformedB.position += opA.text.length;
    }
  }

  if (opA.type === "delete" && opB.type === "insert") {
    if (opA.position < transformedB.position) {
      transformedB.position -= Math.min(
        opA.length,
        transformedB.position - opA.position,
      );
    }
  }

  if (opA.type === "insert" && opB.type === "delete") {
    if (opA.position <= transformedB.position) {
      transformedB.position += opA.text.length;
    }
  }

  if (opA.type === "delete" && opB.type === "delete") {
    if (opA.position < transformedB.position) {
      transformedB.position -= Math.min(
        opA.length,
        transformedB.position - opA.position,
      );
    }
  }

  return transformedB;
};
