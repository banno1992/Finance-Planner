import { useId } from "react";
import { Input } from "@/components/ui/input";
import { evaluateSnapshotAmount } from "@/lib/snapshotAmounts";

interface SnapshotAmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  placeholder?: string;
}

export function SnapshotAmountInput({ value, onChange, label, className, placeholder = "0" }: SnapshotAmountInputProps) {
  const hintId = useId();
  const amount = evaluateSnapshotAmount(value);
  const invalid = amount === null;
  const showHint = invalid || value.includes("+");

  return (
    <>
      <Input
        type="text"
        inputMode="text"
        aria-label={`${label} balance`}
        aria-invalid={invalid}
        aria-describedby={showHint ? hintId : undefined}
        value={value}
        onChange={event => onChange(event.target.value)}
        className={className}
        placeholder={placeholder}
      />
      {showHint && (
        <p id={hintId} className={`mt-1 text-xs ${invalid ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
          {invalid ? "Enter numbers joined by + (e.g. 12+34)." : `= ${amount}`}
        </p>
      )}
    </>
  );
}