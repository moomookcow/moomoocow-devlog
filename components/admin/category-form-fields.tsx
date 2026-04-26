"use client";

import { useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type CategoryOption = {
  id: string;
  name: string;
  depth: number;
};

type CategoryFormFieldsProps = {
  fieldIdPrefix: string;
  parentOptions: CategoryOption[];
  initialParentId?: string | null;
  initialIsActive?: boolean;
};

export function CategoryFormFields({
  fieldIdPrefix,
  parentOptions,
  initialParentId = null,
  initialIsActive = true,
}: CategoryFormFieldsProps) {
  const [parentId, setParentId] = useState(initialParentId ?? "none");
  const [isActive, setIsActive] = useState(initialIsActive);

  const selectedParentLabel = useMemo(() => {
    if (parentId === "none") return "없음(최상위)";
    const found = parentOptions.find((item) => item.id === parentId);
    return found ? `${"· ".repeat(found.depth)}${found.name}` : "없음(최상위)";
  }, [parentId, parentOptions]);

  return (
    <>
      <input type="hidden" name="parentId" value={parentId} readOnly />
      <input type="hidden" name="isActive" value={isActive ? "on" : "off"} readOnly />

      <div className="space-y-1">
        <label htmlFor={`${fieldIdPrefix}-parent`} className="korean-display text-xs text-muted-foreground">
          상위 카테고리
        </label>
        <Select value={parentId} onValueChange={(value) => setParentId(value || "none")}>
          <SelectTrigger id={`${fieldIdPrefix}-parent`} className="korean-display h-9 w-full rounded-none px-3 text-sm data-[size=default]:h-9">
            <SelectValue>{selectedParentLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="none" className="korean-display min-h-9 py-1 text-sm">
              없음(최상위)
            </SelectItem>
            {parentOptions.map((item) => (
              <SelectItem key={item.id} value={item.id} className="korean-display min-h-9 py-1 text-sm">
                {"· ".repeat(item.depth)}
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`${fieldIdPrefix}-active`} className="korean-display flex cursor-pointer items-center gap-2 text-sm">
          활성 상태
          <Switch id={`${fieldIdPrefix}-active`} checked={isActive} onCheckedChange={(checked) => setIsActive(Boolean(checked))} />
        </label>
      </div>
    </>
  );
}

