"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  CalculationResult,
  PlasticCalculatorInput,
} from "../types/carbon";
import { calculateCarbonFootprint } from "../lib/calculator/engine";
import {
  DEFAULT_CALCULATOR_INPUT,
  sanitizeCalculatorInput,
} from "../lib/validation";

interface CalculatorContextType {
  input: PlasticCalculatorInput;
  result: CalculationResult;
  hasCustomized: boolean;
  updateKantongPlastik: (count: number) => void;
  updateWadahMakanan: (count: number) => void;
  updateBotolMinum: (count: number) => void;
  updateWadahStyrofoam: (count: number) => void;
  updateInput: (data: Partial<PlasticCalculatorInput>) => void;
  resetToDefault: () => void;
}

const LOCAL_STORAGE_KEY = "karbon_ai_user_input_plastic_v2";

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState<PlasticCalculatorInput>(DEFAULT_CALCULATOR_INPUT);
  const [hasCustomized, setHasCustomized] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Muat dari localStorage saat client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const sanitized = sanitizeCalculatorInput(parsed);
          setInput(sanitized);
          setHasCustomized(true);
        }
      } catch {
        // Fallback ke default
      } finally {
        setIsHydrated(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Simpan ke localStorage setiap ada perubahan input setelah hidrasi
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(input));
      } catch {
        // Abaikan jika quota error
      }
    }
  }, [input, isHydrated]);

  const updateKantongPlastik = (count: number) => {
    setHasCustomized(true);
    setInput((prev) => ({
      ...prev,
      kantongPlastik: Math.max(0, Math.floor(Number(count) || 0)),
    }));
  };

  const updateWadahMakanan = (count: number) => {
    setHasCustomized(true);
    setInput((prev) => ({
      ...prev,
      wadahMakanan: Math.max(0, Math.floor(Number(count) || 0)),
    }));
  };

  const updateBotolMinum = (count: number) => {
    setHasCustomized(true);
    setInput((prev) => ({
      ...prev,
      botolMinum: Math.max(0, Math.floor(Number(count) || 0)),
    }));
  };

  const updateWadahStyrofoam = (count: number) => {
    setHasCustomized(true);
    setInput((prev) => ({
      ...prev,
      wadahStyrofoam: Math.max(0, Math.floor(Number(count) || 0)),
    }));
  };

  const updateInput = (data: Partial<PlasticCalculatorInput>) => {
    setHasCustomized(true);
    setInput((prev) => sanitizeCalculatorInput({ ...prev, ...data }));
  };

  const resetToDefault = () => {
    setInput(DEFAULT_CALCULATOR_INPUT);
    setHasCustomized(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Abaikan
    }
  };

  // Kalkulasi jejak karbon secara reaktif setiap input berubah
  const result = useMemo(() => {
    return calculateCarbonFootprint(input);
  }, [input]);

  return (
    <CalculatorContext.Provider
      value={{
        input,
        result,
        hasCustomized,
        updateKantongPlastik,
        updateWadahMakanan,
        updateBotolMinum,
        updateWadahStyrofoam,
        updateInput,
        resetToDefault,
      }}
    >
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error("useCalculator must be used within a CalculatorProvider");
  }
  return context;
}
