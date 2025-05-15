import Alert, { type AlertProps } from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { type PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title?: string;
  severity?: AlertProps["severity"];
}>;

export function ResultsAlert({ title, severity = "info", children }: Props) {
  return (
    <Alert severity={severity} sx={{ alignSelf: "center" }}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {children}
    </Alert>
  );
}
