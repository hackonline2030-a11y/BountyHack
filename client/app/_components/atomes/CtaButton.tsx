"use client";

import React from "react";

export default function CtaButton({ children, variant = "primary" }: 
    { children: React.ReactNode, variant: "primary" | "secondary" | "tertiary" }) {
    const styles = "text-md font-bold transition-all duration-300 motion-reduce:duration-0 ease-in-out";
    const variants = {
      primary: "px-15 py-6 bg-pink-500 opacity-100 text-white shadow-md hover:opacity-60 rounded-full cursor-pointer",
      secondary: "px-15 py-6 bg-white shadow-sm text-black hover:text-grayish-blue rounded-full cursor-pointer",
      tertiary: "px-8 py-6 bg-red-500 text-white hover:bg-red-600 cursor-pointer",
    };
  
    return (
      <button className={`${styles} ${variants[variant]}`}>
        {children}
      </button>
    );
  }