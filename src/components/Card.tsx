"use client";

import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-2xl p-6 shadow-lg ${className}`}>
      {children}
    </div>
  );
}
