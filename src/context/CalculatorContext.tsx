"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  CalculationResult,
  ConsumptionData,
  EnergyData,
  FoodData,
  TransportData,
  UserCalculatorInput,
  WasteData,
} from "../types/carbon";
import { calculateCarbonFootprint } from "../lib/calculator/engine";
import {
  DEFAULT_CALCULATOR_INPUT,
  sanitizeCalculatorInput,
} from "../lib/validation";

interface CalculatorContextType {
  input: UserCalculatorInput;
  result: CalculationResult;
  hasCustomized: boolean;
  updateTransport: (data: Partial<TransportData>) => void;
  updateEnergy: (data: Partial<EnergyData>) => void;
  updateFood: (data: Partial<FoodData>) => void;
  updateConsumption: (data: Partial<ConsumptionData>) => void;
  updateWaste: (data: Partial<WasteData>) => void;
  resetToDefault: () => void;
}

const LOCAL_STORAGE_KEY = "karbon_ai_user_input_v1";

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState<UserCalculatorInput>(DEFAULT_CALCULATOR_INPUT);
  const [hasCustomized, setHasCustomized] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Load from localStorage on client mount asynchronously
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
        // Fallback to default
      } finally {
        setIsHydrated(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);


  // Save to localStorage whenever input changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(input));
      } catch {
        // Ignore quota errors
      }
    }
  }, [input, isHydrated]);

  const updateTransport = (data: Partial<TransportData>) => {
    setHasCustomized(true);
    setInput((prev) => ({
      ...prev,
      transport: { ...prev.transport, ...data },
    }));
  };

  const updateEnergy = (data: Partial<EnergyData>) => {
    setHasCustomized(true);
    setInput((prev) => ({
      ...prev,
      energy: { ...prev.energy, ...data },
    }));
  };

  const updateFood = (data: Partial<FoodData>) => {
    setHasCustomized(true);
    setInput((prev) => ({
      ...prev,
      food: { ...prev.food, ...data },
    }));
  };

  const updateConsumption = (data: Partial<ConsumptionData>) => {
    setHasCustomized(true);
    setInput((prev) => ({
      ...prev,
      consumption: { ...prev.consumption, ...data },
    }));
  };

  const updateWaste = (data: Partial<WasteData>) => {
    setHasCustomized(true);
    setInput((prev) => ({
      ...prev,
      waste: { ...prev.waste, ...data },
    }));
  };

  const resetToDefault = () => {
    setInput(DEFAULT_CALCULATOR_INPUT);
    setHasCustomized(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // Re-calculate results reactively whenever input changes
  const result = useMemo(() => {
    return calculateCarbonFootprint(input);
  }, [input]);

  return (
    <CalculatorContext.Provider
      value={{
        input,
        result,
        hasCustomized,
        updateTransport,
        updateEnergy,
        updateFood,
        updateConsumption,
        updateWaste,
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
