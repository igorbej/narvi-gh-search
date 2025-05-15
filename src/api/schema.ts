import { boolean, object, string, number, array } from "yup";

// Only including the fields I'm actually receiving from the API for now (i.e., the required ones).
// TODO: Consider adding spec for the full schema later:
// https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-users
export const userSchema = object({
  login: string().required(),
  id: number().required(),
  node_id: string().required(),
  avatar_url: string().required(),
  gravatar_id: string(),
  url: string().required(),
  html_url: string().required(),
  followers_url: string().required(),
  following_url: string().required(),
  gists_url: string().required(),
  starred_url: string().required(),
  subscriptions_url: string().required(),
  organizations_url: string().required(),
  repos_url: string().required(),
  events_url: string().required(),
  received_events_url: string().required(),
  type: string().required(),
  user_view_type: string().required(),
  site_admin: boolean().required(),
  score: number().required(),
});

export const successApiResponseSchema = object({
  total_count: number().required(),
  incomplete_results: boolean().required(),
  items: array(userSchema).required(),
  /**
   * Note: this field is not part of the actual JSON returned by GitHub;
   * GitHub provides the pagination via the HTTP `Link` header.
   * We read that header and inject the value into the response object during parsing,
   * in order to make GH's pagination play nicely with `react-query`'s API.
   */
  nextPage: number().optional(),
});

export const errorApiResponseSchema = object({
  message: string().required(),
  documentation_url: string().optional(),
});
