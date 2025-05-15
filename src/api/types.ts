import type { InferType } from "yup";
import type {
  userSchema,
  errorApiResponseSchema,
  successApiResponseSchema,
} from "./schema";

export type User = InferType<typeof userSchema>;
export type SuccessApiResponse = InferType<typeof successApiResponseSchema>;
export type ErrorApiResponse = InferType<typeof errorApiResponseSchema>;
