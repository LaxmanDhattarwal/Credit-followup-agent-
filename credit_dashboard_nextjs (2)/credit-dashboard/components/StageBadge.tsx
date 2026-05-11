"use client";
import { STAGES, StageNumber } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  stage: StageNumber;
  size?: "sm" | "md";
}

const sizeMap = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
};

export default function StageBadge({ stage, size = "sm" }: Props) {
  const s = STAGES[stage];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border font-mono font-medium",
        `stage-${stage}`,
        sizeMap[size]
      )}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.dotColor }}
      />
      {s.short}
    </span>
  );
}
