import { ConflictError, NotFoundError, ServiceError, ValidationError } from "@/service/errors";

describe("ServiceError hierarchy", () => {
  describe("ServiceError", () => {
    it("has correct name and message", () => {
      const error = new ServiceError("something failed");
      expect(error.name).toBe("ServiceError");
      expect(error.message).toBe("something failed");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
    });

    it("preserves cause", () => {
      const cause = new Error("root cause");
      const error = new ServiceError("wrapped", cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("NotFoundError", () => {
    it("interpolates entity and identifier into message", () => {
      const error = new NotFoundError("Team", "abc-123");
      expect(error.name).toBe("NotFoundError");
      expect(error.message).toBe("Team not found: abc-123");
    });

    it("is instanceof ServiceError and Error", () => {
      const error = new NotFoundError("User", "id-1");
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(Error);
    });

    it("preserves cause", () => {
      const cause = new Error("db timeout");
      const error = new NotFoundError("League", "id-2", cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("ValidationError", () => {
    it("has correct name and message", () => {
      const error = new ValidationError("Invalid input");
      expect(error.name).toBe("ValidationError");
      expect(error.message).toBe("Invalid input");
    });

    it("stores fieldErrors", () => {
      const fieldErrors = { name: ["too short"], email: ["invalid format"] };
      const error = new ValidationError("Validation failed", fieldErrors);
      expect(error.fieldErrors).toEqual(fieldErrors);
    });

    it("is instanceof ServiceError and Error", () => {
      const error = new ValidationError("bad");
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(Error);
    });

    it("preserves cause", () => {
      const cause = new Error("parse error");
      const error = new ValidationError("bad", undefined, cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("ConflictError", () => {
    it("has correct name and message", () => {
      const error = new ConflictError("Already exists");
      expect(error.name).toBe("ConflictError");
      expect(error.message).toBe("Already exists");
    });

    it("is instanceof ServiceError and Error", () => {
      const error = new ConflictError("dup");
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(Error);
    });

    it("preserves cause", () => {
      const cause = new Error("unique constraint");
      const error = new ConflictError("duplicate", cause);
      expect(error.cause).toBe(cause);
    });
  });
});
