"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export default function FilterDropdown({ label, icon, options, value, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () => document.removeEventListener("click", handleClickOutside, true);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0] || { value: "", label: "Select..." };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
          isOpen 
            ? 'bg-text-primary text-background border-white shadow-xl' 
            : 'bg-text-primary/5 border-border-color text-text-secondary hover:border-white/30 hover:text-text-primary shadow-inner'
        }`}
      >
        <span className="opacity-50">{icon}</span>
        <span className="flex-1 text-left min-w-[80px]">
          {label}: <span className={isOpen ? "text-black" : "text-text-primary"}>{selectedOption.label}</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-background-secondary/95 backdrop-blur-2xl border border-border-color rounded-2xl shadow-custom overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          <div className="p-2 space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                  value === option.value
                    ? 'bg-text-primary text-background'
                    : 'text-text-muted hover:bg-text-primary/5 hover:text-text-primary'
                }`}
              >
                {option.label}
                {value === option.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
