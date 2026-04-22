import React from "react";
import { InlineEdit } from "@/components/dashboard/InlineEdit";

export function Text({
  field,
  value,
  className,
  as: Tag = "span",
  sectionId,
  isPreview,
}: any) {
  if (sectionId && isPreview) {
    return (
      <InlineEdit
        tagName={Tag}
        text={value}
        sectionId={sectionId}
        fieldKey={field}
        isPreview={isPreview}
        className={className}
      />
    );
  }
  return (
    <Tag className={className} dangerouslySetInnerHTML={{ __html: value }} />
  );
}
