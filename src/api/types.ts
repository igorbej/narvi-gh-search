import type { InferType } from "yup";
import type {
  errorApiResponseSchema,
  successApiResponseSchema,
} from "./schema";

export type SuccessApiResponse = InferType<typeof successApiResponseSchema>;
export type ErrorApiResponse = InferType<typeof errorApiResponseSchema>;
