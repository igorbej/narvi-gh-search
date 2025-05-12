import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import InfiniteScroll from "react-infinite-scroller";
import { object, string, type InferType } from "yup";
import type { SuccessApiResponse, ErrorApiResponse } from "./types";
import { mockApiResponse } from "./mockApiResponse";
import { useDebounce } from "./hooks/useDebounce";

const GH_API_URL = "https://api.github.com";
const GH_API_VER = "2022-11-28";
const nextPageRegex = /<.*&page=(.*)>; rel="next"/;

// Adding a mock variant to not exhaust GitHub's API limits too frequently in dev
const isUsingMockData = false;

async function fetchUsers(
  userName: string,
  page: number
): Promise<SuccessApiResponse> {
  console.warn(
    `(fetchUsers) fetching users for query: "${userName}", page: ${page}`
  );

  if (isUsingMockData) {
    console.log("(fetchUsers) using MOCKED data!");

    return {
      ...mockApiResponse,
      items: mockApiResponse.items.map((el) => ({
        ...el,
        id: el.id + page, // Making mock data's repeated ids unique to make them valid React keys
      })),
      nextPage: page < 10 ? page + 1 : undefined,
    };
  }

  console.log("(fetchUsers) fetching REAL data from GitHub!");

  const response = await fetch(
    `${GH_API_URL}/search/users?q=${userName}&page=${page}`,
    {
      headers: {
        // Specifying the API version as per:
        // https://docs.github.com/en/rest/about-the-rest-api/api-versions?apiVersion=2022-11-28#specifying-an-api-version
        "X-GitHub-Api-Version": GH_API_VER,
      },
    }
  );
  const nextPageResult = response.headers.get("link")?.match(nextPageRegex);
  const nextPage = nextPageResult && parseInt(nextPageResult[1], 10);
  const json = await response.json();

  if (!response.ok) {
    throw new Error((json as ErrorApiResponse).message);
  }

  return {
    ...json,
    nextPage,
  };
}

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
    queryFn: async ({ pageParam }) => await fetchUsers(userName, pageParam),
    enabled: userName.length >= 3,
    retry: false, // Curbing our assault on GitHub's API a bit
    initialPageParam: 1, // GitHub's pagination starts at 1
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
  const users = data?.pages.flatMap((page) => page.items);

  if (isError && !isFetchNextPageError) {
    return (
      <i>
        Error fetching user data!
        <br />
        (Error: {error.message})
      </i>
    );
  }

  if (isFetching && !isFetchingNextPage) {
    return <i>Fetching users for query "{userName}"...</i>;
  }

  if (isPending) {
    return <i>No users fetched yet</i>;
  }

  if (!users?.length) {
    return <i>No users found :/</i>;
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
    <>
      <div>Queried value: {userName}</div>
      {isUsingMockData && <small>⚠️ Note: displaying mock data</small>}
      <InfiniteScroll
        pageStart={0} // TODO: look into this
        loadMore={loadMoreUsers}
        hasMore={hasNextPage && !isFetchNextPageError}
        loader={<i key={0}>Loading more users...</i>}
      >
        <ol>
          {users.map(({ id, login }) => (
            <li key={id}>{login}</li>
          ))}
        </ol>
      </InfiniteScroll>
      {!hasNextPage && (
        <small>
          <i>(No more users to fetch for the provided query.)</i>
        </small>
      )}
      {isFetchNextPageError && (
        <small>
          <i>
            Error fetching the next page! No further fetches will be performed.
            <br />
            (Error: {error.message})
          </i>
        </small>
      )}
    </>
  );
}

const schema = object()
  .shape({
    userName: string().required().min(3),
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
    <>
      <h1>GitHub user search</h1>
      <h2>Narvi recruitment assignment</h2>

      <form>
        <div>
          <input placeholder="GitHub username" {...register("userName")} />
          {errors.userName && <div>{errors.userName.message}</div>}
        </div>
      </form>

      <h3>Results:</h3>
      <Results userName={userName} />
    </>
  );
}

export default App;
