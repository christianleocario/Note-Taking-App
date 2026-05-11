import React, { createContext, useContext, useState } from 'react';

const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  const [isSelecting, setIsSelecting] = useState(false);
  return (
    <SelectionContext.Provider value={{ isSelecting, setIsSelecting }}>
      {children}
    </SelectionContext.Provider>
  );
}

export const useSelection = () => useContext(SelectionContext);
