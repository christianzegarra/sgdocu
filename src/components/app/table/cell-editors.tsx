import React, { useState, useRef, useEffect, memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CellTextEditorProps {
  value: string | number | undefined;
  editorType: "text" | "number" | "currency" | "textarea";
  onChange?: (val: string | number | undefined) => void;
  onFocus?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CellTextEditor = memo(function CellTextEditor({ value: extValue, editorType, onChange, onFocus, className, style }: CellTextEditorProps) {
  const [local, setLocal] = useState(String(extValue ?? ""));
  const prevExt = useRef(extValue);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (prevExt.current !== extValue) {
      prevExt.current = extValue;
      setLocal(String(extValue ?? ""));
    }
  }, [extValue]);

  const handleChange = (raw: string) => {
    setLocal(raw);
    let out: string | number | undefined = raw;
    if (editorType === "number") out = raw === "" ? undefined : Number(raw);
    onChange?.(out);
  };

  const handleFocus = () => {
    try {
      ref.current?.select?.();
    } catch {}
    onFocus?.();
  };

  if (editorType === "textarea") {
    return (
      <Textarea
        ref={ref as any}
        value={local}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onDoubleClick={(e) => e.stopPropagation()}
        className={cn("w-full h-full box-border bg-muted/40 outline-none text-xs rounded-xs")}
      />
    );
  }

  return (
    <Input
      ref={ref as any}
      type={editorType === "number" ? "number" : "text"}
      inputMode={editorType === "number" || editorType === "currency" ? "numeric" : undefined}
      value={local}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
      onFocus={handleFocus}
      className={className}
      onDoubleClick={(e) => e.stopPropagation()}
      style={style}
    />
  );
});

interface CellSelectEditorProps {
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange?: (val: string | undefined) => void;
  onFocus?: () => void;
  className?: string;
}

export const CellSelectEditor = memo(function CellSelectEditor({ value, options, onChange, onFocus, className }: CellSelectEditorProps) {
  const [local, setLocal] = React.useState<string>(String(value ?? ""));

  React.useEffect(() => {
    if (String(value ?? "") !== local) setLocal(String(value ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Select
      value={local}
      onValueChange={(v: string) => {
        setLocal(v);
        onFocus?.();
        onChange?.(v === "" ? undefined : v);
      }}
      onOpenChange={(isOpen: boolean) => isOpen && onFocus?.()}
    >
      <SelectTrigger size='sm' className={className}>
        <SelectValue>{String(local ?? "")}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
});

export default {
  CellTextEditor,
  CellSelectEditor,
};
