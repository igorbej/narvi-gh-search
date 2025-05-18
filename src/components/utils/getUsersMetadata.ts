import type { User } from "../../api/types";

const initialMetadata = {
  regularUsers: 0,
  organizations: 0,
  admins: 0,
};

// FUNCTIONAL PROGRAMMING TECHNIQUE
// I didn't organically stumble upon a place where I knew I'd like to utilize a neat FP technique &
// highlight it, so, for the purposes of completing the assignment, I'm creating a small feature
// displaying metadata about the users, which uses `reduce` — probably my favorite FP-related operation.
export function getUsersMetadata(users?: User[]) {
  return users?.reduce<typeof initialMetadata>(
    (acc, user) => ({
      regularUsers: acc.regularUsers + (user.type === "User" ? 1 : 0),
      organizations: acc.organizations + (user.type === "Organization" ? 1 : 0),
      admins: acc.admins + (user.site_admin ? 1 : 0),
    }),
    initialMetadata
  );
}
