// src/lib/ucp-sdk.tsx
import React from "react";
import { InlineEdit } from "@/components/dashboard/InlineEdit";

export const UCP = {
  Text: function UcpText({
    field,
    default: defaultText,
    className,
    as: Tag = "span",
    sectionId,
    isPreview,
  }: any) {
    // If sectionId exists, it means this is rendering in your REAL SaaS Portfolio Builder!
    if (sectionId) {
      return (
        <InlineEdit
          tagName={Tag}
          text={defaultText}
          sectionId={sectionId}
          fieldKey={field}
          isPreview={isPreview}
          className={className}
        />
      );
    }

    // Fallback if rendered outside the builder (e.g., live published site)
    return <Tag className={className}>{defaultText}</Tag>;
  },
};
