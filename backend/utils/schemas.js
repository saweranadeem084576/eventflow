const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "invalid id");
const pagination = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .passthrough();

exports.register = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["user", "organizer"]).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});
exports.login = z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(1) }),
  params: z.object({}),
  query: z.object({}),
});
exports.forgotPassword = z.object({
  body: z.object({ email: z.string().email() }),
  params: z.object({}),
  query: z.object({}),
});
exports.resetPassword = z.object({
  body: z.object({ newPassword: z.string().min(8) }),
  params: z.object({ token: z.string().min(32) }),
  query: z.object({}),
});
exports.changePassword = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
  params: z.object({}),
  query: z.object({}),
});
const eventBody = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.coerce.date(),
  location: z.string().trim().min(1),
  category: z.string().trim().min(1),
  image: z.string().trim().url().optional(),
  images: z.array(z.string().trim().url()).max(3).optional(),
  price: z.coerce.number().min(0),
  capacity: z.coerce.number().int().min(1),
});

exports.eventCreate = z.object({
  body: eventBody,
  params: z.object({}),
  query: z.object({}),
});
exports.eventUpdate = z.object({
  body: eventBody
    .partial()
    .refine(
      (body) => Object.keys(body).length > 0,
      "at least one field is required",
    ),
  params: z.object({ id: objectId }),
  query: z.object({}),
});
exports.bookingCreate = z.object({
  body: z.object({ event: objectId }),
  params: z.object({}),
  query: z.object({}),
});
exports.paymentIntent = z.object({
  body: z.object({ booking: objectId }),
  params: z.object({}),
  query: z.object({}),
});
exports.feedbackCreate = z.object({
  body: z.object({
    event: objectId,
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});
exports.complaintCreate = z.object({
  body: z.object({
    subject: z.string().trim().min(1).max(150),
    description: z.string().trim().min(1).max(2000),
  }),
  params: z.object({}),
  query: z.object({}),
});
exports.userUpdate = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      role: z.enum(["user", "organizer", "admin"]).optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "at least one field is required",
    ),
  params: z.object({ id: objectId }),
  query: z.object({}),
});
exports.complaintResolve = z.object({
  body: z.object({ resolution: z.string().trim().min(1).max(2000) }),
  params: z.object({ id: objectId }),
  query: z.object({}),
});
exports.device = z.object({
  body: z.object({ token: z.string().trim().min(20).max(4096) }),
  params: z.object({}),
  query: z.object({}),
});
exports.pagination = z.object({
  body: z.object({}),
  params: z.object({}),
  query: pagination,
});
