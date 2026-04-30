// src/lib/ucp-sdk/types.d.ts

declare module '@ucp/sdk' {
  import * as React from 'react';

  /**
   * The Universal Creator Platform (UCP) SDK.
   * Provides components and hooks to build dynamic, customizable marketplace themes.
   */
  export const UCP: {
    /** * A rich text element that allows end-users to edit content inline on the canvas. 
     * * @example
     * <UCP.Text field="headline" default="Welcome!" className="text-2xl font-bold" />
     */
    Text: React.FC<{ 
      /** The unique key in your schema that this text binds to. */
      field: string; 
      /** The fallback text to display if the user hasn't typed anything yet. */
      default?: string; 
      /** Tailwind classes for styling. */
      className?: string; 
      /** The HTML tag to render (e.g., 'h1', 'p', 'span'). Defaults to 'span'. */
      as?: any; 
    }>;

    // You will add more components here later, like Image, Carousel, etc.
  };
}