import { useCallback, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArg = any;

export function useDebounce(
  fn: (...args: AnyArg[]) => void,
  debounceAmountMs: number,
  /**
   * Callback for debounce events receiving either:
   * - an approx. timestamp of when the debounce will finish, if the debounce timeout has been set, or
   * - `undefined`, if the timeout has just elapsed or has been cleared
   */
  onDebounceEvent?: (endTimestamp: number | undefined) => void
) {
  const timeoutId = useRef<number>(undefined);

  const debounced = useCallback(
    async (...args: AnyArg[]) => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = undefined;
        onDebounceEvent?.(undefined);
      }

      onDebounceEvent?.(performance.now() + debounceAmountMs);
      timeoutId.current = setTimeout(() => {
        fn(...args);
        timeoutId.current = undefined;
        onDebounceEvent?.(undefined);
      }, debounceAmountMs);
    },
    [fn, debounceAmountMs, onDebounceEvent]
  );

  return debounced;
}
