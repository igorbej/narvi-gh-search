import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string, type InferType } from "yup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { useDebounce } from "./hooks/useDebounce";
import { Results } from "./components/Results";
import { DebounceProgressBar } from "./components/DebounceProgressBar";

const DEBOUNCE_AMOUNT_MS = 2000;
const UI_WIDTH_PX = 500;

const schema = object()
  .shape({
    userName: string().required().max(39), // 39 is GitHub's username max length limit
  })
  .required();

type Inputs = InferType<typeof schema>;

const defaultValues: Inputs = {
  userName: "",
};

function App() {
  const [userName, setUserName] = useState("");
  const [debounceEndTimestamp, setDebounceEndTimestamp] = useState<number>();
  const {
    register,
    handleSubmit,
    formState: { isValidating, isValid, errors },
  } = useForm<Inputs>({
    defaultValues,
    mode: "onChange",
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<Inputs> = useCallback((data) => {
    setUserName(data.userName);
  }, []);

  const onDebounceEvent = useCallback((endTimestamp: number | undefined) => {
    setDebounceEndTimestamp(endTimestamp);
  }, []);

  const onSubmitDebounced = useDebounce(
    onSubmit,
    DEBOUNCE_AMOUNT_MS,
    onDebounceEvent
  );

  const submitForm = useMemo(
    () => handleSubmit(onSubmitDebounced),
    [handleSubmit, onSubmitDebounced]
  );

  useEffect(() => {
    if (!isValidating && isValid) {
      submitForm();
    }
  }, [isValidating, isValid, submitForm]);

  return (
    <AppContainer>
      <Stack>
        <Typography variant="h4" sx={{ mb: 1.5 }}>
          GitHub user search
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 6 }}>
          Narvi recruitment assignment
        </Typography>

        <StyledForm>
          <TextField
            fullWidth
            label="GitHub username"
            error={!!errors.userName}
            helperText={errors.userName?.message}
            {...register("userName")}
          />
          <DebounceProgressBar debounceEndTimestamp={debounceEndTimestamp} />
        </StyledForm>

        <Results userName={userName} />
      </Stack>
    </AppContainer>
  );
}

export default App;

const AppContainer = styled(Stack, { label: "AppContainer" })(() => ({
  margin: "0 auto",
  maxWidth: UI_WIDTH_PX,
  // Not very likely to happen, but adding this to make sure
  // extremely long strings don't overflow the UI's `maxWidth` above
  wordBreak: "break-word",
}));

const StyledForm = styled("form", { label: "StyledForm" })(({ theme }) => ({
  marginBottom: theme.spacing(6),
}));
