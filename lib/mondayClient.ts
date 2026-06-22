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

interface EmployeeDirectoryItem {
  name: string;
  column_values: { id: string; text: string | null }[];
}

interface ItemsPage {
  cursor: string | null;
  items: EmployeeDirectoryItem[];
}

let cachedEmployeeNames: { names: string[]; fetchedAt: number } | null = null;
const EMPLOYEE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — keeps the form fast
// while still picking up directory edits within a few minutes.

/**
 * Pulls every "Active" employee name off the Employee Directory board in
 * monday.com, paginating through all items (the board currently has ~300).
 * Results are cached in memory for a few minutes so the form doesn't hit the
 * monday API on every page load, while still reflecting directory edits
 * (new hires, status changes) shortly after they happen.
 */
export async function getActiveEmployeeNames(): Promise<string[]> {
  if (
    cachedEmployeeNames &&
    Date.now() - cachedEmployeeNames.fetchedAt < EMPLOYEE_CACHE_TTL_MS
  ) {
    return cachedEmployeeNames.names;
  }

  const { EMPLOYEE_DIRECTORY_BOARD_ID, EMPLOYEE_DIRECTORY_COLUMN_ID, EMPLOYEE_DIRECTORY_ACTIVE_STATUS_LABEL } =
    await import("./mondayConfig");

  const names: string[] = [];
  let cursor: string | null = null;
  let isFirstPage = true;

  while (isFirstPage || cursor) {
    isFirstPage = false;
    let page: ItemsPage;

    if (cursor) {
      const data = await mondayGraphQL<{ next_items_page: ItemsPage }>(
        `query ($cursor: String!) {
          next_items_page (cursor: $cursor, limit: 500) {
            cursor
            items {
              name
              column_values(ids: ["${EMPLOYEE_DIRECTORY_COLUMN_ID.status}"]) {
                id
                text
              }
            }
          }
        }`,
        { cursor }
      );
      page = data.next_items_page;
    } else {
      const data = await mondayGraphQL<{ boards: { items_page: ItemsPage }[] }>(
        `query ($boardId: ID!) {
          boards (ids: [$boardId]) {
            items_page (limit: 500) {
              cursor
              items {
                name
                column_values(ids: ["${EMPLOYEE_DIRECTORY_COLUMN_ID.status}"]) {
                  id
                  text
                }
              }
            }
          }
        }`,
        { boardId: EMPLOYEE_DIRECTORY_BOARD_ID }
      );
      page = data.boards[0]?.items_page ?? { cursor: null, items: [] };
    }

    for (const item of page.items) {
      const statusText = item.column_values.find(
        (c) => c.id === EMPLOYEE_DIRECTORY_COLUMN_ID.status
      )?.text;
      if (statusText === EMPLOYEE_DIRECTORY_ACTIVE_STATUS_LABEL && item.name) {
        names.push(item.name);
      }
    }

    cursor = page.cursor;
  }

  names.sort((a, b) => a.localeCompare(b));
  cachedEmployeeNames = { names, fetchedAt: Date.now() };
  return names;
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
