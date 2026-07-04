// AI Response contract — Sprint 06 Step 05.
//
// Wraps the raw AI output string in a structured object. This is a shaping
// layer only: `text` carries the exact, unmodified model output; `meta` is
// not read by the UI yet. It exists so multi-part responses (annotations,
// interpretation, diffs — Sprint 07+) have a contract to grow into.

export type AIResponse = {
  text: string;
  meta: {
    operationType: string;
  };
};
