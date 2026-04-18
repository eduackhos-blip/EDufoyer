import { ZodSchema } from "zod";

export const validateBody = <T>(schema: ZodSchema<T>, payload: unknown) => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten(),
    };
  }
  return {
    success: true as const,
    data: parsed.data,
  };
};

