// Utility function to add cursor-pointer class to button className strings
export const addCursorPointer = (className: string): string => {
  if (className.includes('cursor-pointer') || className.includes('cursor-not-allowed')) {
    return className;
  }
  return `${className} cursor-pointer`;
};

// Utility function to add disabled cursor class
export const addDisabledCursor = (className: string): string => {
  if (className.includes('cursor-not-allowed')) {
    return className;
  }
  return className.replace('cursor-pointer', 'cursor-not-allowed');
};

