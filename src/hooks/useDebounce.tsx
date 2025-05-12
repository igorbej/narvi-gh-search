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
        console.log("(debounced) clearing previous timeout!");
        clearTimeout(timeoutId.current);
        timeoutId.current = undefined;
      } else {
        console.log("(debounced) no previous timeout to clear");
      }

      console.log("(debounced) setting new timeout...");
      timeoutId.current = setTimeout(() => {
        console.log("(debounced) timeout finished! calling target fn now");
        fn(...args);
        timeoutId.current = undefined;
      }, debounceAmountMs);
    },
    [fn, debounceAmountMs]
  );

  return debounced;
}
