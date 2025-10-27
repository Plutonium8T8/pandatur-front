import { useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const useChatUrlSync = ({
  // Состояние фильтров
  chatFilters,
  isFiltered,
  
  // Состояние поиска
  rawSearchQuery,
  
  // Состояние "Мои тикеты"
  showMyTickets,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializedRef = useRef(false);
  const lastStateRef = useRef({});

  // Функция для сравнения состояний
  const hasStateChanged = (currentState) => {
    const lastState = lastStateRef.current;
    return (
      lastState.isFiltered !== currentState.isFiltered ||
      JSON.stringify(lastState.filters) !== JSON.stringify(currentState.filters)
    );
  };

  // Функция для обновления URL
  const updateUrl = useCallback((state) => {
    if (!hasStateChanged(state)) return;
    
    setSearchParams((prev) => {
      const newParams = new URLSearchParams();
      
      // НЕ добавляем поиск и "Мои тикеты" - они локальные
      // Добавляем только серверные фильтры
      if (state.isFiltered && Object.keys(state.filters).length > 0) {
        newParams.set("is_filtered", "true");
        
        // Добавляем каждый фильтр в URL
        Object.entries(state.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              value.forEach((val) => newParams.append(key, val));
            } else if (typeof value === "object" && ("from" in value || "to" in value)) {
              if (value.from) newParams.set(`${key}_from`, value.from);
              if (value.to) newParams.set(`${key}_to`, value.to);
            } else {
              newParams.set(key, String(value));
            }
          }
        });
      }
      
      return newParams;
    });
    
    lastStateRef.current = { ...state };
  }, [setSearchParams]);

  // Функция для сброса URL
  const resetUrl = () => {
    setSearchParams(() => new URLSearchParams());
    lastStateRef.current = {};
  };

  // Парсинг состояния из URL при инициализации
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const urlSearch = searchParams.get("search");
    const urlShowMyTickets = searchParams.get("show_my_tickets") === "true";
    const urlIsFiltered = searchParams.get("is_filtered") === "true";
    
    // Парсим фильтры из URL
    const urlFilters = {};
    for (const [key, value] of searchParams.entries()) {
      if (key === "search" || key === "show_my_tickets" || key === "is_filtered") continue;
      
      if (key.endsWith("_from") || key.endsWith("_to")) {
        const baseKey = key.replace(/_from$|_to$/, "");
        if (!urlFilters[baseKey]) urlFilters[baseKey] = {};
        if (key.endsWith("_from")) urlFilters[baseKey].from = value;
        if (key.endsWith("_to")) urlFilters[baseKey].to = value;
      } else {
        // Для массивов используем getAll
        const values = searchParams.getAll(key);
        urlFilters[key] = values.length > 1 ? values : values[0];
      }
    }
    
    // Сохраняем начальное состояние
    lastStateRef.current = {
      search: urlSearch || "",
      showMyTickets: urlShowMyTickets,
      isFiltered: urlIsFiltered,
      filters: urlFilters,
    };
    
    isInitializedRef.current = true;
  }, [searchParams]);

  // Синхронизация состояния с URL (только серверные фильтры)
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const currentState = {
      isFiltered,
      filters: chatFilters,
    };
    
    updateUrl(currentState);
  }, [isFiltered, chatFilters, updateUrl]);

  return {
    resetUrl,
  };
};
