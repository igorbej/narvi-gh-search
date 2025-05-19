import { useRef, useState, useEffect } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const BAR_REFRESH_INTERVAL_MS = 1000 / 60; // Aiming for 60fps

type Props = {
  debounceEndTimestamp: number | undefined;
};

export function DebounceProgressBar({ debounceEndTimestamp }: Props) {
  const intervalId = useRef<number>(undefined);
  const [barPercentage, setBarPercentage] = useState(0);

  useEffect(() => {
    if (!debounceEndTimestamp) {
      clearInterval(intervalId.current);
      setBarPercentage(0);
      return;
    }

    setBarPercentage(100);

    const timeLeftMs = debounceEndTimestamp - performance.now();
    const numOfUpdates = timeLeftMs / BAR_REFRESH_INTERVAL_MS;
    const amountReducedPerStep = timeLeftMs / numOfUpdates;
    const percentageReducedPerStep = (amountReducedPerStep / timeLeftMs) * 100;

    let counter = numOfUpdates;
    intervalId.current = setInterval(() => {
      setBarPercentage((v) => Math.max(v - percentageReducedPerStep, 0));

      counter--;
      if (counter === 0) {
        clearInterval(intervalId.current);
      }
    }, BAR_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId.current);
    };
  }, [debounceEndTimestamp]);

  if (!debounceEndTimestamp || barPercentage <= 0) {
    return null;
  }

  return (
    <>
      <Stack sx={{ mt: 1, alignItems: "center" }}>
        <LinearProgress
          variant="determinate"
          value={barPercentage}
          sx={{
            minWidth: 200,
            ".MuiLinearProgress-bar": {
              transition: "none",
            },
          }}
        />
        <Typography variant="caption">Debouncing your search...</Typography>
      </Stack>
    </>
  );
}
