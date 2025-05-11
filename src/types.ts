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

export type ApiResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: User[];
};
