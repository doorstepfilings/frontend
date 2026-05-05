"use client";

import { useState } from "react";

const ICON_LIST = [
    "fa-briefcase", "fa-file-invoice", "fa-landmark", "fa-user-tie", 
    "fa-building", "fa-shield-halved", "fa-calculator", "fa-stamp",
    "fa-balance-scale", "fa-chart-pie", "fa-hand-holding-dollar", "fa-file-contract",
    "fa-gavel", "fa-globe", "fa-users-gear", "fa-file-shield"
];

export function IconPicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    return (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {ICON_LIST.map((icon) => (
                <button
                    key={icon}
                    type="button"
                    onClick={() => onChange(icon)}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg transition-all ${
                        value === icon 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" 
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    }`}
                >
                    <i className={`fas ${icon}`}></i>
                </button>
            ))}
        </div>
    );
}
