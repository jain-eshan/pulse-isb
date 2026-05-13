// Type declarations for Google Maps Extended Component Library web components
import type React from "react";

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      "gmpx-api-loader": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        key?: string;
        "solution-channel"?: string;
      };
      "gmpx-place-picker": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        placeholder?: string;
        style?: React.CSSProperties;
      };
    }
  }
}
