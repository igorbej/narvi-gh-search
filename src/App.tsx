import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import InfiniteScroll from "react-infinite-scroller";
import { object, string, type InferType } from "yup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
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
      <Typography component="div" fontStyle="italic">
        <Typography>Error fetching user data!</Typography>
        <Typography variant="caption">(Error: {error.message})</Typography>
      </Typography>
    );
  }

  if (isFetching && !isFetchingNextPage) {
    return (
      <Typography fontStyle="italic">
        Looking for users matching "{userName}"...
      </Typography>
    );
  }

  if (isPending) {
    return (
      <Typography component="div" fontStyle="italic">
        <Typography>No user data fetched yet</Typography>
        <Typography variant="caption">Start typing to search</Typography>
      </Typography>
    );
  }

  if (!users?.length) {
    return (
      <Typography fontStyle="italic">
        No users for the given query found :/
      </Typography>
    );
  }

  const loadMoreUsers = async () => {
    if (isFetchNextPageError) {
      console.log(
        "(loadMoreUsers) there was an error fetching the next page, `loadMoreUsers` won't be called anymore"
      );
      return;
    }

    if (isFetchingNextPage) {
      console.log(
        "(loadMoreUsers) another fetch is in progress, stopping the function"
      );
      return;
    }

    console.log("(loadMoreUsers) loading...");
    await fetchNextPage();
    console.log("(loadMoreUsers) more users loaded!");
  };

  return (
    <Stack alignItems="center">
      <Typography>Queried value: "{userName}"</Typography>
      {shouldUseMockData && (
        <Typography variant="caption">
          ⚠️ Note: displaying hard-coded mock data
        </Typography>
      )}
      <StyledInfiniteScroll
        pageStart={0} // TODO: look into this
        loadMore={loadMoreUsers}
        hasMore={hasNextPage && !isFetchNextPageError}
        loader={
          <Typography key={0} fontStyle="italic">
            Loading more users...
          </Typography>
        }
      >
        <List>
          {users.map(({ id, login, avatar_url, html_url }) => (
            <ListItem key={id} alignItems="flex-start" sx={{ p: "0.5rem" }}>
              <ListItemAvatar>
                <Avatar alt={login} src={avatar_url} />
              </ListItemAvatar>
              <StyledListItemText
                primary={login}
                secondary={
                  <>
                    <Typography variant="body2">{id}</Typography>
                    <Link
                      href={html_url}
                      display="block" // Making sure links can get ellipsized too, if need be
                    >
                      {html_url}
                    </Link>
                  </>
                }
                slots={{ secondary: "div" }}
              />
            </ListItem>
          ))}
        </List>
      </StyledInfiniteScroll>
      {!hasNextPage && (
        <Typography fontStyle="italic">
          There are no more users matching the provided query.
        </Typography>
      )}
      {isFetchNextPageError && (
        <>
          <Typography component="div" fontStyle="italic">
            <Typography>
              Error fetching the next page! No further fetches will be
              performed.
            </Typography>
            <Typography variant="caption">(Error: {error.message})</Typography>
          </Typography>
        </>
      )}
    </Stack>
  );
}

const StyledInfiniteScroll = styled(InfiniteScroll, {
  label: "StyledInfiniteScroll",
})(() => ({
  margin: "1rem 0",
  maxWidth: 450,
}));

const StyledListItemText = styled(ListItemText, {
  label: "StyledListItemText",
})(() => ({
  // Text overflow shouldn't be a huge problem with GH username's max character limit of 39,
  // but I'm erring on the side of caution here
  "& .MuiTypography-root": {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
}));

const schema = object()
  .shape({
    userName: string().required().max(39), // 39 is GitHub's username max length limit
  })
  .required();

type Inputs = InferType<typeof schema>;

const defaultValues: Inputs = {
  userName: "",
};
const DEBOUNCE_AMOUNT_MS = 2000;

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
    <Container>
      <Stack justifyContent="space-between" alignItems="stretch">
        <Typography variant="h3" mb="1rem">
          GitHub user search
        </Typography>
        <Typography variant="h5" mb="3rem">
          Narvi recruitment assignment
        </Typography>

        <Stack direction="row" justifyContent="center">
          <StyledForm>
            <TextField
              fullWidth
              label="GitHub username"
              error={!!errors.userName}
              helperText={errors.userName?.message}
              {...register("userName")}
            />
          </StyledForm>
        </Stack>

        <Typography variant="h5" mb="2rem">
          Results:
        </Typography>
        <Results userName={userName} />
      </Stack>
    </Container>
  );
}

export default App;

const StyledForm = styled("form", { label: "StyledForm" })(() => ({
  marginBottom: "3rem",
  maxWidth: 450,
  flexGrow: 1,
}));
