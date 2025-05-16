import { useCallback, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArg = any;

export function useDebounce(
  fn: (...args: AnyArg[]) => void,
  debounceAmountMs: number
) {
  const timeoutId = useRef<number>(undefined);

  const debounced = useCallback(
    async (...args: AnyArg[]) => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = undefined;
      }

      timeoutId.current = setTimeout(() => {
        fn(...args);
        timeoutId.current = undefined;
      }, debounceAmountMs);
    },
    [fn, debounceAmountMs]
  );

  return debounced;
}
