import InfiniteScroll from "react-infinite-scroller";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem, { type ListItemProps } from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import { styled } from "@mui/material/styles";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import type { User } from "../api/types";
import { ResultsAlert } from "./ResultsAlert";

type Props = Pick<
  UseInfiniteQueryResult,
  | "hasNextPage"
  | "fetchNextPage"
  | "isFetchingNextPage"
  | "isFetchNextPageError"
  | "error"
> & {
  users: User[];
  isUsingMockData: boolean;
};

export function UsersList({
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  error,
  users,
  isUsingMockData,
}: Props) {
  const loadMoreUsers = async () => {
    if (isFetchNextPageError) {
      return;
    }

    if (isFetchingNextPage) {
      return;
    }

    await fetchNextPage();
  };

  return (
    <>
      <StyledInfiniteScroll
        pageStart={0}
        loadMore={loadMoreUsers}
        hasMore={hasNextPage && !isFetchNextPageError}
        loader={<CircularProgress key="loader-key" size="1.5rem" />}
      >
        <List>
          {users.map(
            ({ id, login, type, avatar_url, html_url, site_admin }, idx) => (
              <StyledListItem
                // Making mock data's repeated ids unique
                key={isUsingMockData ? `${id}-${idx}` : id}
                isSiteAdmin={site_admin}
              >
                <ListItemAvatar sx={{ m: 0 }}>
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
                        aria-label="GitHub user ID"
                      >
                        {id}
                      </Typography>
                      <Link
                        variant="body2"
                        href={html_url}
                        display="block" // Making sure links can get ellipsized too, if need be
                        aria-label="GitHub profile link"
                      >
                        {html_url}
                      </Link>
                    </>
                  }
                  slots={{ primary: "div", secondary: "div" }}
                  slotProps={{
                    primary: { "aria-label": "GitHub username" },
                  }}
                />
                <StyledChip
                  variant="outlined"
                  size="small"
                  label={site_admin ? "Admin" : type}
                  {...(site_admin && { color: "secondary" })}
                />
              </StyledListItem>
            )
          )}
        </List>
      </StyledInfiniteScroll>
      {!hasNextPage && (
        <ResultsAlert>There are no more users matching the query.</ResultsAlert>
      )}
      {isFetchNextPageError && (
        <ResultsAlert severity="error" title="Error fetching the next page!">
          Error: {error?.message}
        </ResultsAlert>
      )}
    </>
  );
}

const StyledInfiniteScroll = styled(InfiniteScroll, {
  label: "StyledInfiniteScroll",
})(({ theme }) => ({
  margin: theme.spacing(1, 0, 2),
}));

interface StyledListItemProps extends ListItemProps {
  isSiteAdmin: boolean;
}

const StyledListItem = styled(ListItem, {
  label: "StyledListItem",
  shouldForwardProp: (prop) => prop !== "isSiteAdmin", // Make sure there's no attempt to add the custom prop to the DOM
})<StyledListItemProps>(({ theme, isSiteAdmin }) => ({
  alignItems: "flex-start",
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1.5),
  border: isSiteAdmin
    ? `1px solid ${theme.palette.secondary.main}`
    : `0.5px solid ${theme.palette.grey[300]}`,
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
})(({ theme }) => ({
  margin: `0 ${theme.spacing(1.5)}`,
  minWidth: "50px",
  // Text overflow shouldn't be a huge problem with GH username's max character limit of 39,
  // but I'm erring on the side of caution here
  "& .MuiListItemText-primary, .MuiListItemText-secondary, .MuiTypography-root":
    {
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
