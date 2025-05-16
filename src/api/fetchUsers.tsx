import { mockApiResponse } from "./mockApiResponse";
import { successApiResponseSchema } from "./schema";
import type { SuccessApiResponse, ErrorApiResponse } from "./types";

const GH_API_URL = "https://api.github.com";
const GH_API_VER = "2022-11-28";
const nextPageRegex = /<.*&page=(.*)>; rel="next"/;

export async function fetchUsers(
  userName: string,
  page: number,
  shouldUseMockData: boolean,
  signal: AbortSignal
): Promise<SuccessApiResponse> {
  console.log(
    `(fetchUsers) fetching users for query: "${userName}", page: ${page}`
  );

  if (shouldUseMockData) {
    const data = {
      ...mockApiResponse,
      items: mockApiResponse.items.map((el) => ({
        ...el,
        id: el.id + page, // Making mock data's repeated ids unique to make them valid React keys
      })),
      nextPage: page < 10 ? page + 1 : undefined,
    };

    try {
      const dataValidated = await successApiResponseSchema.validate(data);
      return dataValidated;
    } catch (e) {
      console.error("yup validation error:", e);
    }
  }

  const response = await fetch(
    `${GH_API_URL}/search/users?q=${userName}&page=${page}`,
    {
      headers: {
        // Specifying the API version as per:
        // https://docs.github.com/en/rest/about-the-rest-api/api-versions?apiVersion=2022-11-28#specifying-an-api-version
        "X-GitHub-Api-Version": GH_API_VER,
      },
      signal,
    }
  );
  const nextPageResult = response.headers.get("link")?.match(nextPageRegex);
  const nextPage = nextPageResult ? parseInt(nextPageResult[1], 10) : undefined;
  const json = await response.json();

  if (!response.ok) {
    throw new Error((json as ErrorApiResponse).message);
  }

  const jsonValidated = await successApiResponseSchema.validate(json);

  return {
    ...jsonValidated,
    nextPage,
  };
}
