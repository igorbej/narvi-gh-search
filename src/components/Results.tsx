import { useInfiniteQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { fetchUsers } from "../api/fetchUsers";
import { ResultsAlert } from "./ResultsAlert";
import { UsersList } from "./UsersList";
import { getUsersMetadata } from "./utils/getUsersMetadata";

// Adding a mock variant to not exhaust GitHub's API limits too frequently in dev
const shouldUseMockData = false;

type Props = {
  userName: string;
};

export function Results({ userName }: Props) {
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
    refetchOnWindowFocus: false,
    initialPageParam: 1, // GitHub's pagination starts at 1
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
  const users = data?.pages.flatMap((page) => page.items);
  const metadata = getUsersMetadata(users);

  if (isError && !isFetchNextPageError) {
    return (
      <ResultsAlert title="Error fetching user data!" severity="error">
        (Error: {error.message})
      </ResultsAlert>
    );
  }

  if (isFetching && !isFetchingNextPage) {
    return (
      <ResultsAlert>Looking for users matching "{userName}"...</ResultsAlert>
    );
  }

  if (isPending) {
    return (
      <ResultsAlert title="No user data fetched yet">
        Start typing to search
      </ResultsAlert>
    );
  }

  if (!users?.length) {
    return (
      <ResultsAlert title="No users for the given query found ☹️">
        Wanna give it another go?
      </ResultsAlert>
    );
  }

  return (
    <Stack>
      <Typography variant="h5">
        Results for: <b>"{userName}"</b>
      </Typography>
      <Box>
        <Typography variant="caption">
          users: {metadata?.regularUsers} | organizations:{" "}
          {metadata?.organizations} | admins: {metadata?.admins}
        </Typography>
      </Box>
      {shouldUseMockData && (
        <Typography variant="caption">
          ⚠️ Note: displaying hard-coded mock data
        </Typography>
      )}

      <UsersList
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isFetchNextPageError={isFetchNextPageError}
        error={error}
        users={users}
        isUsingMockData={shouldUseMockData}
      />
    </Stack>
  );
}
