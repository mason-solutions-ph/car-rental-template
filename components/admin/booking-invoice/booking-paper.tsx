import {
  BOOKING_PAPER_HEIGHT,
  BOOKING_PAPER_WIDTH,
  type BookingPaperModel,
} from "./data";

/**
 * Pixel-faithful port of Studio Admin InvoicePaper, filled with booking data.
 * Keep light paper colors even in dark mode (document authenticity).
 */
export function BookingPaper({ model }: { model: BookingPaperModel }) {
  return (
    <article
      style={{ width: BOOKING_PAPER_WIDTH, height: BOOKING_PAPER_HEIGHT }}
      data-print-paper
      className="relative flex flex-col gap-24 bg-neutral-50 px-12.25 py-11 font-mono text-neutral-950"
    >
      <header className="flex flex-col gap-10">
        <div className="grid grid-cols-2 items-start gap-14">
          <svg className="size-12" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect y="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" y="28" width="20" height="20" rx="3" fill="currentColor" />
          </svg>
          <h2 className="text-4xl uppercase tracking-widest">Booking</h2>
        </div>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p>Reference: {model.referenceNumber}</p>
            <p>Issued: {model.issuedLabel}</p>
            <p>Pickup: {model.pickupLabel}</p>
            <p>Drop-off: {model.dropoffLabel}</p>
          </div>
          <div>
            <p>Payment account</p>
            <p>{model.paymentAccountName}</p>
            <p className="break-all">Ref no. {model.routingNumber}</p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p className="mb-4 font-semibold uppercase">From</p>
            <p>{model.from.name}</p>
            {model.from.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div>
            <p className="mb-4 font-semibold uppercase">Bill to</p>
            <p>{model.to.name}</p>
            <p>{model.to.phone}</p>
            {model.to.license ? <p>License: {model.to.license}</p> : null}
            {model.to.locationLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>
      </header>

      <div className="flex flex-col gap-5">
        <section className="text-sm">
          <div className="grid grid-cols-[1fr_74px_116px_116px] bg-stone-200 px-3 py-3 font-semibold uppercase">
            <span>Description</span>
            <span className="text-right">Units</span>
            <span className="text-right">Unit cost</span>
            <span className="text-right">Line total</span>
          </div>
          {model.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_74px_116px_116px] border-[oklch(0.86_0_0)] border-b px-3 py-4"
            >
              <span>{item.description}</span>
              <span className="text-right">{item.quantity}</span>
              <span className="text-right">{item.unitPriceLabel}</span>
              <span className="text-right">{item.lineTotalLabel}</span>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <section className="text-neutral-600">
            {model.customerNote ? (
              <>
                <p className="mb-2 font-semibold uppercase text-neutral-950">
                  Note
                </p>
                <p>{model.customerNote}</p>
              </>
            ) : (
              <p>Prepared for fleet operations.</p>
            )}
          </section>
          <section className="space-y-2">
            <div>
              <div className="flex justify-between gap-8">
                <span>Net amount</span>
                <span>{model.subtotalLabel}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>Fees</span>
                <span>{model.feesLabel}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>Amount paid</span>
                <span>{model.amountPaidLabel}</span>
              </div>
            </div>
            <div className="border-current border-y-2 py-3">
              <div className="flex justify-between gap-8">
                <span className="font-semibold uppercase">Balance due</span>
                <span className="font-semibold">{model.totalLabel}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="absolute right-12.25 bottom-11 left-12.25 grid grid-cols-2 gap-14 text-neutral-500 text-sm leading-relaxed">
        <div>
          <p>{model.from.email}</p>
          <p>{model.from.phone}</p>
          <p>{model.from.website}</p>
        </div>
        <div>
          <p className="capitalize">
            Status: {model.bookingStatus} · Payment: {model.paymentStatus}
          </p>
          <p>Issued by {model.from.name}</p>
        </div>
      </footer>
    </article>
  );
}
