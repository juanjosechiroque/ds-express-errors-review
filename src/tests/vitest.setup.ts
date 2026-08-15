import { beforeEach, vi } from "vitest";
import mockMongoose from "./mongoose-mock.js";

process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/vitest";
process.env.JWT_SECRET ??= "test-jwt-secret-thirty-two-chars-min";

vi.mock("mongoose", () => ({
    default: mockMongoose,
    ...mockMongoose,
}));

const mockUserId = "507f1f77bcf86cd799439011";

function mockActiveUserLookup() {
    mockMongoose.model("User").findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
            _id: mockUserId,
            email: "test@example.com",
            status: "active",
        }),
    });
}

beforeEach(() => {
    mockActiveUserLookup();
});

vi.mock("../utils/jwt.js", () => ({
    generateToken: vi.fn(() => "valid-token"),
    verifyToken: vi.fn((token) => {
        if (token === "valid-token") {
            return { sub: mockUserId, email: "test@example.com" };
        }
        // Mirrors the shape jsonwebtoken throws for an invalid token — see jwt.ts.
        // ds-express-errors maps errors by `.name`, so this must look like a real
        // JsonWebTokenError, not the app's own old error shape.
        throw Object.assign(new Error("invalid signature"), { name: "JsonWebTokenError" });
    }),
}));
