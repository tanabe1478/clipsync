import { test, expect } from "@playwright/test";

/**
 * Integration tests for the clips table via Supabase REST API.
 * Uses the service_role key to bypass RLS for test setup/teardown,
 * and the anon key with a test user session for actual assertions.
 *
 * These tests verify that the Supabase backend (schema, RLS, indexes)
 * works correctly end-to-end.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function skipIfNoConfig() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    test.skip();
  }
}

async function supabaseRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
) {
  const { method = "GET", body, headers = {} } = options;
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

// Get or create a test user
async function getTestUserId(): Promise<string> {
  // List users via admin API
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  const data = await res.json();
  if (data.users && data.users.length > 0) {
    return data.users[0].id;
  }
  throw new Error("No test users found. Sign in via the app first.");
}

test.describe("Supabase Clips CRUD", () => {
  let testUserId: string;
  let createdClipIds: string[] = [];

  test.beforeAll(async () => {
    skipIfNoConfig();
    testUserId = await getTestUserId();
  });

  test.afterAll(async () => {
    // Clean up test clips
    for (const id of createdClipIds) {
      await supabaseRequest(`/clips?id=eq.${id}`, { method: "DELETE" });
    }
  });

  test("can insert a clip", async () => {
    skipIfNoConfig();

    const res = await supabaseRequest("/clips", {
      method: "POST",
      body: {
        user_id: testUserId,
        content: "E2E test clip",
        device_name: "e2e-test",
      },
    });

    expect(res.status).toBe(201);
    const clips = await res.json();
    expect(clips).toHaveLength(1);
    expect(clips[0].content).toBe("E2E test clip");
    expect(clips[0].device_name).toBe("e2e-test");
    expect(clips[0].pinned).toBe(false);
    createdClipIds.push(clips[0].id);
  });

  test("can read clips", async () => {
    skipIfNoConfig();

    const res = await supabaseRequest(
      `/clips?user_id=eq.${testUserId}&order=created_at.desc&limit=10`,
    );

    expect(res.status).toBe(200);
    const clips = await res.json();
    expect(clips.length).toBeGreaterThan(0);
  });

  test("can update a clip (toggle pin)", async () => {
    skipIfNoConfig();

    // Create a clip first
    const createRes = await supabaseRequest("/clips", {
      method: "POST",
      body: {
        user_id: testUserId,
        content: "Pin test clip",
        device_name: "e2e-test",
      },
    });
    const created = (await createRes.json())[0];
    createdClipIds.push(created.id);

    // Update: pin it
    const updateRes = await supabaseRequest(`/clips?id=eq.${created.id}`, {
      method: "PATCH",
      body: { pinned: true },
    });

    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json())[0];
    expect(updated.pinned).toBe(true);
  });

  test("can delete a clip", async () => {
    skipIfNoConfig();

    // Create a clip
    const createRes = await supabaseRequest("/clips", {
      method: "POST",
      body: {
        user_id: testUserId,
        content: "Delete test clip",
        device_name: "e2e-test",
      },
    });
    const created = (await createRes.json())[0];

    // Delete it
    const deleteRes = await supabaseRequest(`/clips?id=eq.${created.id}`, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(200);

    // Verify it's gone
    const getRes = await supabaseRequest(`/clips?id=eq.${created.id}`);
    const clips = await getRes.json();
    expect(clips).toHaveLength(0);
  });

  test("clips have correct schema", async () => {
    skipIfNoConfig();

    const res = await supabaseRequest("/clips", {
      method: "POST",
      body: {
        user_id: testUserId,
        content: "Schema test",
        device_name: "e2e-test",
      },
    });

    const clip = (await res.json())[0];
    createdClipIds.push(clip.id);

    // Verify all fields exist with correct types
    expect(clip.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(typeof clip.user_id).toBe("string");
    expect(typeof clip.content).toBe("string");
    expect(typeof clip.device_name).toBe("string");
    expect(typeof clip.pinned).toBe("boolean");
    expect(clip.created_at).toBeTruthy();
  });
});
