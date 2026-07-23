"use client";

import { useCallback, useId, useRef, useState } from "react";
import { ImageIcon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  ALLOWED_CAR_IMAGE_TYPES,
  MAX_CAR_IMAGE_BYTES,
  validateCarImageFile,
} from "@/lib/admin/upload-image";
import { cn } from "@/lib/utils";

type UploadFn = (
  formData: FormData
) => Promise<{ url?: string; error?: string }>;

export function ImageDropzone({
  id,
  name = "heroImageUrl",
  value,
  onChange,
  upload,
  disabled = false,
  label = "Hero image",
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (url: string) => void;
  upload: UploadFn;
  disabled?: boolean;
  label?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = disabled || uploading;

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file || busy) return;
      setLocalError(null);

      const validation = validateCarImageFile(file);
      if (!validation.ok) {
        setLocalError(validation.error);
        toast.error(validation.error);
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const result = await upload(fd);
        if (result.error) {
          setLocalError(result.error);
          toast.error(result.error);
          return;
        }
        if (result.url) {
          onChange(result.url);
          toast.success("Image uploaded");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not upload image.";
        setLocalError(message);
        toast.error(message);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [busy, onChange, upload]
  );

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={value} />

      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-label={`${label}: drop or click to upload`}
        aria-disabled={busy}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onClick={() => {
          if (!busy) fileInputRef.current?.click();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!busy) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!busy) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          if (busy) return;
          const file = e.dataTransfer.files?.[0];
          void handleFile(file);
        }}
        className={cn(
          "relative flex min-h-[10rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30 p-4 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
          busy && "pointer-events-none opacity-70",
          localError && "border-destructive/50"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary remote/local URLs
          <img
            src={value}
            alt="Hero preview"
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}

        <div
          className={cn(
            "relative z-10 flex flex-col items-center gap-2",
            value &&
              "rounded-lg bg-background/85 px-4 py-3 shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm"
          )}
        >
          {uploading ? (
            <>
              <Spinner className="size-5" />
              <p className="text-sm font-medium">Uploading…</p>
            </>
          ) : value ? (
            <>
              <ImageIcon className="text-muted-foreground size-5" />
              <p className="text-sm font-medium">Replace image</p>
              <p className="text-muted-foreground text-xs">
                Drop a new file or click to browse
              </p>
            </>
          ) : (
            <>
              <UploadIcon className="text-muted-foreground size-5" />
              <p className="text-sm font-medium">Drop image or click to browse</p>
              <p className="text-muted-foreground text-xs">
                JPG, PNG, or WebP · max {Math.round(MAX_CAR_IMAGE_BYTES / 1024 / 1024)}
                MB
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_CAR_IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          disabled={busy}
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
          }}
        />
      </div>

      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label
            htmlFor={`${inputId}-url`}
            className="text-muted-foreground text-xs font-medium"
          >
            Or paste image URL
          </label>
          <Input
            id={`${inputId}-url`}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={value}
            disabled={busy}
            onChange={(e) => {
              setLocalError(null);
              onChange(e.target.value);
            }}
          />
        </div>
        {value ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={busy}
            aria-label="Clear image"
            onClick={() => {
              setLocalError(null);
              onChange("");
            }}
          >
            <XIcon className="size-4" />
          </Button>
        ) : null}
      </div>

      {localError ? (
        <p className="text-destructive text-xs" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
