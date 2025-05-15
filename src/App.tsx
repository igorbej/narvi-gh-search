import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import InfiniteScroll from "react-infinite-scroller";
import { object, string, type InferType } from "yup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import CircularProgress from "@mui/material/CircularProgress";
import { styled } from "@mui/material/styles";
import { useDebounce } from "./hooks/useDebounce";
import { fetchUsers } from "./api/fetchUsers";

// Adding a mock variant to not exhaust GitHub's API limits too frequently in dev
const shouldUseMockData = false;

function Results({ userName }: { userName: string }) {
  const {
    isFetching,
    isFetchingNextPage,
    isPending,
    isError,
    isFetchNextPageError,
    error,
    data,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["users", userName],
    queryFn: async ({ pageParam, signal }) =>
      await fetchUsers(userName, pageParam, shouldUseMockData, signal),
    enabled: userName.length > 0,
    retry: false, // Curbing our assault on GitHub's API a bit
    initialPageParam: 1, // GitHub's pagination starts at 1
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
  const users = data?.pages.flatMap((page) => page.items);

  if (isError && !isFetchNextPageError) {
    return (
      <StyledAlert severity="error">
        <AlertTitle>Error fetching user data!</AlertTitle>
        (Error: {error.message})
      </StyledAlert>
    );
  }

  if (isFetching && !isFetchingNextPage) {
    return (
      <StyledAlert severity="info">
        Looking for users matching "{userName}"...
      </StyledAlert>
    );
  }

  if (isPending) {
    return (
      <StyledAlert severity="info">
        <AlertTitle>No user data fetched yet</AlertTitle>
        Start typing to search
      </StyledAlert>
    );
  }

  if (!users?.length) {
    return (
      <StyledAlert severity="info">
        <AlertTitle>No users for the given query found ☹️</AlertTitle>
        Wanna give it another go?
      </StyledAlert>
    );
  }

  const loadMoreUsers = async () => {
    if (isFetchNextPageError) {
      console.log("(loadMoreUsers) there was an error fetching the next page");
      return;
    }

    if (isFetchingNextPage) {
      console.log("(loadMoreUsers) another fetch in progress, stopping the fn");
      return;
    }

    console.log("(loadMoreUsers) loading...");
    await fetchNextPage();
    console.log("(loadMoreUsers) more users loaded!");
  };

  return (
    <Stack>
      <Typography variant="h5">
        Results for: <b>"{userName}"</b>
      </Typography>
      {shouldUseMockData && (
        <Typography variant="caption">
          ⚠️ Note: displaying hard-coded mock data
        </Typography>
      )}
      <StyledInfiniteScroll
        pageStart={0} // TODO: look into this
        loadMore={loadMoreUsers}
        hasMore={hasNextPage && !isFetchNextPageError}
        loader={<CircularProgress key="loader-key" size="1.5rem" />}
      >
        <List>
          {users.map(({ id, login, type, avatar_url, html_url }) => (
            <StyledListItem key={id} alignItems="flex-start">
              <ListItemAvatar sx={{ m: 0, mr: 1.5 }}>
                <StyledAvatar alt={login} src={avatar_url} />
              </ListItemAvatar>

              <StyledListItemText
                primary={login}
                secondary={
                  <>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      fontSize="0.75rem"
                    >
                      {id}
                    </Typography>
                    <Link
                      variant="body2"
                      href={html_url}
                      display="block" // Making sure links can get ellipsized too, if need be
                    >
                      {html_url}
                    </Link>
                  </>
                }
                slots={{ secondary: "div" }}
              />
              <StyledChip label={type} variant="outlined" size="small" />
            </StyledListItem>
          ))}
        </List>
      </StyledInfiniteScroll>
      {!hasNextPage && (
        <StyledAlert severity="info">
          There are no more users matching the query.
        </StyledAlert>
      )}
      {isFetchNextPageError && (
        <StyledAlert severity="warning">
          <AlertTitle>Error fetching the next page!</AlertTitle>
          Error: {error.message}
        </StyledAlert>
      )}
    </Stack>
  );
}

const StyledAlert = styled(Alert, {
  label: "StyledAlert",
})(() => ({
  alignSelf: "center",
}));

const StyledInfiniteScroll = styled(InfiniteScroll, {
  label: "StyledInfiniteScroll",
})(({ theme }) => ({
  margin: theme.spacing(1, 0, 2),
}));

const StyledListItem = styled(ListItem, {
  label: "StyledListItem",
})(({ theme }) => ({
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1.5),
  border: `0.5px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
}));

const StyledAvatar = styled(Avatar, {
  label: "StyledAvatar",
})(({ theme }) => ({
  width: "4rem",
  height: "4rem",
  border: `0.5px solid ${theme.palette.grey[300]}`,
}));

const StyledListItemText = styled(ListItemText, {
  label: "StyledListItemText",
})(() => ({
  margin: 0,
  // Text overflow shouldn't be a huge problem with GH username's max character limit of 39,
  // but I'm erring on the side of caution here
  "& .MuiTypography-root": {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
}));

const StyledChip = styled(Chip, {
  label: "StyledChip",
})(({ theme }) => ({
  borderWidth: 0.5,
  borderRadius: theme.shape.borderRadius,
}));

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
  const onSubmitDebounced = useDebounce(onSubmit, DEBOUNCE_AMOUNT_MS);
  const submitForm = useMemo(
    () => handleSubmit(onSubmitDebounced),
    [handleSubmit, onSubmitDebounced]
  );

  useEffect(() => {
    if (!isValidating && isValid) {
      console.log("(useEffect) submitting form!");
      submitForm();
    }
  }, [isValidating, isValid, submitForm]);

  return (
    <AppContainer>
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
      </StyledForm>

      <Results userName={userName} />
    </AppContainer>
  );
}

export default App;

const AppContainer = styled(Stack, { label: "AppContainer" })(() => ({
  flexGrow: 1,
  maxWidth: UI_WIDTH_PX,
  // Not very likely to happen, but adding this to make sure
  // extremely long strings don't overflow UI's `maxWidth`
  wordBreak: "break-word",
}));

const StyledForm = styled("form", { label: "StyledForm" })(({ theme }) => ({
  marginBottom: theme.spacing(6),
}));
