import { GET } from "@/app/api/health/route";
import prisma from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}));

const mockedPrisma = prisma as unknown as { $queryRaw: jest.Mock };

describe("GET /api/health", () => {
  const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  const makeRequest = (headers: Record<string, string> = {}) =>
    ({
      headers: {
        get: (key: string) => headers[key.toLowerCase()] ?? headers[key] ?? null,
      },
    }) as unknown as Request;

  it("returns ok response with build metadata and logs timing", async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce(1);

    const request = makeRequest({ "x-request-id": "req-123" });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "ok",
      db: "ok",
      requestId: "req-123",
    });
    expect(body.responseTimeMs).toEqual(expect.any(Number));
    expect(body.build).toMatchObject({
      version: expect.any(String),
      commit: expect.any(String),
      buildTime: expect.any(String),
    });
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('"status":"ok"'));
  });

  it("returns 503 response when db probe fails and logs error", async () => {
    mockedPrisma.$queryRaw.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("error");
    expect(body.db).toBe("unhealthy");
    expect(body.error).toMatch(/db down/);
    expect(body.requestId).toBeDefined();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('"status":"error"'));
  });
});
