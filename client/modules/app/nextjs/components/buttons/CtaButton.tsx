"use client";

import React from "react";

export default function CtaButton({ children, variant = "primary" }: 
    { children: React.ReactNode, variant: "primary" | "secondary" | "tertiary" }) {
    const styles = "cta-btn-common";
    const variants = {
      primary: "cta-btn-primary",
      secondary: "cta-btn-secondary",
      tertiary: "cta-btn-tertiary",
    };
  
    return (
      <button className={`${styles} ${variants[variant]}`}>
        {children}
      </button>
    );
  }