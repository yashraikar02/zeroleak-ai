import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const ENTITY_COLORS = {
  PERSON: {
    bg: 'rgba(56, 184, 121, 0.12)',
    border: '#E5484D',
    text: '#50D291',
    chip: 'bg-[#E5484D]/15 text-[#50D291] border-[#E5484D]/35',
  },
  AADHAAR: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: '#F59E0B',
    text: '#FBBF24',
    chip: 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/35',
  },
  PAN: {
    bg: 'rgba(167, 139, 250, 0.12)',
    border: '#A78BFA',
    text: '#C4B5FD',
    chip: 'bg-[#A78BFA]/15 text-[#C4B5FD] border-[#A78BFA]/35',
  },
  GSTIN: {
    bg: 'rgba(56, 189, 248, 0.12)',
    border: '#38BDF8',
    text: '#7DD3FC',
    chip: 'bg-[#38BDF8]/15 text-[#7DD3FC] border-[#38BDF8]/35',
  },
  ADDRESS: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: '#10B981',
    text: '#34D399',
    chip: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/35',
  },
  PASSPORT: {
    bg: 'rgba(236, 72, 153, 0.12)',
    border: '#EC4899',
    text: '#F472B6',
    chip: 'bg-[#EC4899]/15 text-[#F472B6] border-[#EC4899]/35',
  },
  VOTER_ID: {
    bg: 'rgba(251, 146, 60, 0.12)',
    border: '#FB923C',
    text: '#FDBA74',
    chip: 'bg-[#FB923C]/15 text-[#FDBA74] border-[#FB923C]/35',
  },
  PHONE: {
    bg: 'rgba(132, 204, 22, 0.12)',
    border: '#84CC16',
    text: '#A3E635',
    chip: 'bg-[#84CC16]/15 text-[#A3E635] border-[#84CC16]/35',
  },
  EMAIL: {
    bg: 'rgba(6, 182, 212, 0.12)',
    border: '#06B6D4',
    text: '#22D3EE',
    chip: 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/35',
  },
  DATE_OF_BIRTH: {
    bg: 'rgba(232, 121, 249, 0.12)',
    border: '#E879F9',
    text: '#F0ABFC',
    chip: 'bg-[#E879F9]/15 text-[#F0ABFC] border-[#E879F9]/35',
  },
  BANK_ACCOUNT: {
    bg: 'rgba(244, 63, 94, 0.12)',
    border: '#F43F5E',
    text: '#FB7185',
    chip: 'bg-[#F43F5E]/15 text-[#FB7185] border-[#F43F5E]/35',
  },
};

export function getEntityStyle(type) {
  return ENTITY_COLORS[type?.toUpperCase()] || {
    bg: 'rgba(154, 166, 158, 0.12)',
    border: '#9A9A9A',
    text: '#F5F5F5',
    chip: 'bg-[#9A9A9A]/15 text-[#F5F5F5] border-[#9A9A9A]/35',
  };
}

export function formatTimestamp(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return isoString;
  }
}
