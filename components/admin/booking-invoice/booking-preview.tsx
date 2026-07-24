"use client";

import * as React from "react";
import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

import { BookingPaper } from "./booking-paper";
import {
  BOOKING_PAPER_HEIGHT,
  BOOKING_PAPER_SCALE,
  BOOKING_PAPER_WIDTH,
  type BookingPaperModel,
} from "./data";
import { PrintBooking } from "./print-booking";
import { useVisibleCenterPosition } from "./use-visible-center-position";

function handlePrint() {
  window.print();
}

export function BookingPreview({ model }: { model: BookingPaperModel }) {
  const previewBodyRef = React.useRef<HTMLDivElement>(null);
  const paperLayout = useVisibleCenterPosition(previewBodyRef, {
    height: BOOKING_PAPER_HEIGHT,
    maxScale: BOOKING_PAPER_SCALE,
    width: BOOKING_PAPER_WIDTH,
  });

  return (
    <>
      <PrintBooking model={model} />
      <div className="flex flex-col rounded-xl border bg-card">
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="font-medium text-lg">Preview</h2>
          <ButtonGroup>
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Printer data-icon="inline-start" />
              Print
            </Button>
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Download data-icon="inline-start" />
              Download PDF
            </Button>
          </ButtonGroup>
        </div>

        <div
          ref={previewBodyRef}
          className="@container/preview relative min-h-[calc(100svh-15rem)] flex-1 rounded-b-xl bg-stone-200 p-4 dark:bg-stone-800"
        >
          {paperLayout === null ? (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
              Loading Preview
            </div>
          ) : null}
          <div
            style={{
              height: paperLayout
                ? BOOKING_PAPER_HEIGHT * paperLayout.scale
                : BOOKING_PAPER_HEIGHT * BOOKING_PAPER_SCALE,
              top: paperLayout?.top ?? "50%",
              transform:
                paperLayout === null
                  ? "translate(-50%, -50%)"
                  : "translateX(-50%)",
              width: paperLayout
                ? BOOKING_PAPER_WIDTH * paperLayout.scale
                : BOOKING_PAPER_WIDTH * BOOKING_PAPER_SCALE,
            }}
            className="absolute left-1/2 opacity-0 data-[ready=true]:opacity-100"
            data-ready={paperLayout !== null}
          >
            <div
              style={{
                transform: `scale(${paperLayout?.scale ?? BOOKING_PAPER_SCALE})`,
              }}
              className="origin-top-left"
            >
              <BookingPaper model={model} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
