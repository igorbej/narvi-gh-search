// Only including the fields I'm actually receiving from the API for now.
// TODO: Consider adding spec for the full schema later:
// https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-users
type User = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
  score: number;
};

type ApiResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: User[];
};

export type SuccessApiResponse = ApiResponse & {
  /**
   * Note: this field is not part of the actual JSON returned by GitHub;
   * GitHub provides the pagination via the HTTP `Link` header.
   * We read that header and inject the value into the response object during parsing,
   * in order to make GH's pagination play nicely with `react-query`'s API.
   */
  nextPage?: number;
};

export type ErrorApiResponse = {
  message: string;
  documentation_url?: string;
};
