import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";
import type { ApiResponse } from "./types";

const GH_API_URL = "https://api.github.com";
const GH_API_VER = "2022-11-28";

function Results({ userName }: { userName: string }) {
  const { isFetching, isPending, isError, data } = useQuery<ApiResponse>({
    queryKey: ["users", userName],
    queryFn: () =>
      fetch(`${GH_API_URL}/search/users?q=${userName}`, {
        headers: {
          "X-GitHub-Api-Version": GH_API_VER,
        },
      }).then((res) => res.json()),
    enabled: userName.length > 3,
  });

  if (isError) {
    return <div>Error fetching users!</div>;
  }

  if (isFetching) {
    return <div>Fetching...</div>;
  }

  if (isPending) {
    return <div>Users not fetched yet</div>;
  }

  if (!data?.items.length) {
    return <div>No users found :/</div>;
  }

  return (
    <ol>
      {data.items.map(({ id, login }) => (
        <li key={id}>{login}</li>
      ))}
    </ol>
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
