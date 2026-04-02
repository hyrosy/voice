import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  text: string;
  sectionId: string;
  fieldKey: string;
  isPreview?: boolean;
  className?: string;
  // 🚀 FIX 1: Restrict to HTML elements only (No SVGs!)
  tagName?: keyof HTMLElementTagNameMap;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  text,
  sectionId,
  fieldKey,
  isPreview = false,
  className,
  tagName = "span",
}) => {
  // 🚀 FIX 2: Use 'any' for the ref to bypass the strict JSX Union errors
  const textRef = useRef<any>(null);

  // 🚀 FIX 3: Cast the dynamic Tag as 'any' so React doesn't panic on the spread props
  const Tag = tagName as any;

  if (!isPreview) {
    return <Tag className={className}>{text}</Tag>;
  }

  const handleBlur = () => {
    if (!textRef.current) return;
    const newText = textRef.current.innerText;

    if (newText !== text) {
      window.parent.postMessage(
        {
          type: "INLINE_EDIT",
          payload: {
            sectionId,
            fieldKey,
            value: newText,
          },
        },
        "*"
      );
    }
  };

  return (
    <Tag
      ref={textRef}
      contentEditable={true}
      suppressContentEditableWarning={true}
      onBlur={handleBlur}
      // 🚀 FIX 4: Type the keyboard event as 'any' to satisfy the strict union
      onKeyDown={(e: any) => e.stopPropagation()}
      className={cn(
        className,
        "hover:outline-dashed hover:outline-1 hover:outline-primary/50 transition-all cursor-text rounded-sm empty:before:content-['Empty_Text...'] empty:before:text-muted-foreground"
      )}
    >
      {text}
    </Tag>
  );
};
