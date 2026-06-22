// Server-only helper for talking to the monday.com API.
// Requires MONDAY_API_KEY to be set as an environment variable in Vercel
// (Project Settings → Environment Variables). Never expose this key to the client.

const MONDAY_API_URL = "https://api.monday.com/v2";

export async function mondayGraphQL<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MONDAY_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables."
    );
  }

  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(
      `Monday API error: ${json.errors.map((e: { message: string }) => e.message).join("; ")}`
    );
  }
  return json.data as T;
}

interface MondayUser {
  id: string;
  name: string;
}

let cachedUsers: MondayUser[] | null = null;

export async function findMondayUserIdByName(
  name: string
): Promise<string | null> {
  if (!name) return null;
  if (!cachedUsers) {
    const data = await mondayGraphQL<{ users: MondayUser[] }>(
      `query { users { id name } }`
    );
    cachedUsers = data.users;
  }
  const normalized = name.trim().toLowerCase();
  const match = cachedUsers.find((u) => u.name.trim().toLowerCase() === normalized);
  return match ? match.id : null;
}

export async function uploadFileToColumn(
  itemId: string,
  columnId: string,
  file: Blob,
  filename: string
): Promise<void> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) {
    throw new Error("MONDAY_API_KEY is not set.");
  }

  const query = `mutation ($file: File!) {
    add_file_to_column (item_id: ${itemId}, column_id: "${columnId}", file: $file) {
      id
    }
  }`;

  const form = new FormData();
  form.append("query", query);
  form.append("variables[file]", file, filename);

  const res = await fetch(`${MONDAY_API_URL}/file`, {
    method: "POST",
    headers: { Authorization: apiKey },
    body: form,
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(
      `Monday file upload error: ${json.errors.map((e: { message: string }) => e.message).join("; ")}`
    );
  }
}
