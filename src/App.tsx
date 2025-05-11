import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";
import InfiniteScroll from "react-infinite-scroller";
import type { ApiResponse } from "./types";
import { mockApiResponse } from "./mockApiResponse";

const GH_API_URL = "https://api.github.com";
const GH_API_VER = "2022-11-28";

// Adding a mock variant to not exhaust GitHub's API limits too frequently in dev
const isUsingMockData = true;

async function fetchUsers(
  userName: string,
  page: number
): Promise<ApiResponse> {
  console.log(`fetching users for query: "${userName}", page: ${page}`);

  if (isUsingMockData) {
    console.log("using MOCKED data!");

    // TODO: artificial delay too see loading states, remove later
    await new Promise((res) => setTimeout(res, 1000));

    return {
      ...mockApiResponse,
      items: mockApiResponse.items.map((el) => ({
        ...el,
        id: el.id + page, // Making mock data's repeated ids unique to make them valid React keys
      })),
    };
  }

  console.log("fetching REAL data from GitHub!");

  // TODO: the `page` param should be parsed from the response headers
  return fetch(`${GH_API_URL}/search/users?q=${userName}&page=${page}`, {
    headers: {
      // Specifying the API version as per:
      // https://docs.github.com/en/rest/about-the-rest-api/api-versions?apiVersion=2022-11-28#specifying-an-api-version
      "X-GitHub-Api-Version": GH_API_VER,
    },
  }).then((res) => res.json());
}

function Results({ userName }: { userName: string }) {
  const {
    isFetching,
    isFetchingNextPage,
    isPending,
    isError,
    data,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["users", userName],
    queryFn: async ({ pageParam }) => await fetchUsers(userName, pageParam),
    enabled: userName.length >= 3,
    initialPageParam: 1, // GitHub's pagination starts at 1
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // TODO: look into what the correct condition here should be
      if (!lastPage.items.length) {
        return undefined;
      }

      return lastPageParam + 1;
    },
  });
  const users = data?.pages.flatMap((page) => page.items);

  if (isError) {
    return <div>Error fetching users!</div>;
  }

  if (isFetching && !isFetchingNextPage) {
    return <div>Fetching users for query "{userName}"...</div>;
  }

  if (isPending) {
    return <div>Users not fetched yet</div>;
  }

  if (!users) {
    return <div>No users found :/</div>;
  }

  const loadMoreUsers = async () => {
    if (isFetchingNextPage) {
      console.log("another fetch is in progress, aborting `loadMoreUsers` fn");
      return;
    }

    console.log("loading more users...");
    await fetchNextPage();
    console.log("more users loaded!");
  };

  return (
    <>
      <div>Queried value: {userName}</div>
      {isUsingMockData && <small>⚠️ Note: displaying mock data</small>}
      <InfiniteScroll
        pageStart={0} // TODO: look into this
        loadMore={loadMoreUsers}
        hasMore={hasNextPage}
        loader={<div key={0}>Loading more users...</div>}
      >
        <ol>
          {users.map(({ id, login }) => (
            <li key={id}>{login}</li>
          ))}
        </ol>
      </InfiniteScroll>
    </>
  );
}

type Inputs = {
  userName: string;
};

function App() {
  const [userName, setUserName] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onValid: SubmitHandler<Inputs> = (data) => {
    console.log("form valid, data:", data);
    setUserName(data.userName);
  };

  const onInvalid: SubmitErrorHandler<Inputs> = (errors) => {
    console.log("form invalid, errors:", errors);
  };

  return (
    <>
      <h1>GitHub user search</h1>
      <h2>Narvi recruitment assignment</h2>

      <form onSubmit={handleSubmit(onValid, onInvalid)}>
        <div>
          <input
            placeholder="GitHub username"
            {...register("userName", {
              required: true,
            })}
          />
          {errors.userName && <div>This field is invalid!</div>}
        </div>
        <input type="submit" />
      </form>

      <h3>Results:</h3>
      <Results userName={userName} />
    </>
  );
}

export default App;
