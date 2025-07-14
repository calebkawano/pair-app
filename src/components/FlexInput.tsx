import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useState } from "react";

interface Option {
  label: string;
  value: string;
}

export type FlexValue = {
  type: "dropdown" | "text";
  value: string;
};

interface FlexInputProps {
  id: string;
  label: string;
  value: FlexValue;
  onChange: (v: FlexValue) => void;
  options?: Option[]; // Required if dropdown is allowed
  placeholder?: string;
  dropdownPlaceholder?: string;
  textPlaceholder?: string;
  maxLength?: number;
  className?: string;
}

// 250-char default limit for text entry.
const DEFAULT_MAX_LEN = 250;

export function FlexInput({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder,
  dropdownPlaceholder,
  textPlaceholder,
  maxLength = DEFAULT_MAX_LEN,
  className,
}: FlexInputProps) {
  const [inputMode, setInputMode] = useState<"dropdown" | "text">(value.type);

  const switchMode = () => {
    const newMode: "dropdown" | "text" = inputMode === "dropdown" ? "text" : "dropdown";
    setInputMode(newMode);
    onChange({ type: newMode, value: "" });
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <Label htmlFor={id}>{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={switchMode}
        >
          {inputMode === "dropdown" ? "Switch to: Customize" : "Switch to: Built in List"}
        </Button>
      </div>
      {inputMode === "dropdown" ? (
        <Select
          value={value.value}
          onValueChange={(v) => onChange({ type: "dropdown", value: v })}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={dropdownPlaceholder || placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          placeholder={textPlaceholder || placeholder}
          maxLength={maxLength}
          value={value.value}
          onChange={(e) =>
            onChange({ type: "text", value: e.target.value.slice(0, maxLength) })
          }
        />
      )}
    </div>
  );
} 