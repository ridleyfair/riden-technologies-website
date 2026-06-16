"use client";

import { MotionConfig } from "framer-motion";

/** Wraps the public marketing pages so all Framer Motion animations respect
 *  the visitor's "reduce motion" OS setting. */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
