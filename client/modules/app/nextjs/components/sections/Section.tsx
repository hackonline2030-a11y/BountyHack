import React, { forwardRef } from "react";

interface SectionProps {
  children: React.ReactNode;
  classNames?: string;
  fluid?: boolean;
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { children, classNames, fluid }: SectionProps,
  ref
): React.ReactElement {
  return (
    <section
      ref={ref}
      className={`${fluid ? "section-container-fluid" : "section-container"} ${classNames}`}
    >
      {children}
    </section>
  );
});