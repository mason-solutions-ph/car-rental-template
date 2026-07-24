"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { BookingPaper } from "./booking-paper";
import type { BookingPaperModel } from "./data";

export function PrintBooking({ model }: { model: BookingPaperModel }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div data-print-root>
      <BookingPaper model={model} />
    </div>,
    document.body
  );
}
