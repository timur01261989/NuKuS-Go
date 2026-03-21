import { z } from "zod";

export const phoneSchema = z.string().regex(/^998\d{9}$/, "O'zbekiston telefon raqami kerak (+998xxxxxxxxx)");

export const createOrderSchema = z.object({
  pickup:  z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
  dropoff: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
  service_type: z.enum(["taxi", "delivery", "freight", "intercity", "interdistrict"]),
  payment_method: z.enum(["payme", "click", "uzcard", "humo", "wallet", "cash"]).optional(),
});

export const sendOtpSchema   = z.object({ phone: phoneSchema });
export const verifyOtpSchema = z.object({ phone: phoneSchema, code: z.string().length(6) });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type SendOtpInput     = z.infer<typeof sendOtpSchema>;
