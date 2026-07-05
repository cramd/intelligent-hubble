const REBRICKABLE_BASE_URL = 'https://rebrickable.com/api/v3';

export interface LegoSet {
  set_num: string;
  name: string;
  year: number;
  theme_id: number;
  num_parts: number;
  set_img_url: string;
  set_url: string;
  last_modified_dt: string;
}

export interface UserSet {
  list_id: number;
  quantity: number;
  include_spares: boolean;
  set: LegoSet;
}

export interface Theme {
  id: number;
  parent_id: number | null;
  name: string;
}

class RebrickableError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'RebrickableError';
  }
}

// Basic delay for throttling
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchFromRebrickable<T>(endpoint: string, options?: { method?: string; body?: any; retries?: number }): Promise<T> {
  const apiKey = process.env.REBRICKABLE_API_KEY;
  if (!apiKey) {
    throw new Error('REBRICKABLE_API_KEY is not defined in environment variables.');
  }

  const url = `${REBRICKABLE_BASE_URL}${endpoint}`;
  const retries = options?.retries || 3;
  const method = options?.method || 'GET';
  
  for (let i = 0; i < retries; i++) {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `key ${apiKey}`,
        'Accept': 'application/json',
        ...(options?.body ? { 'Content-Type': 'application/json' } : {})
      },
    };

    if (options?.body) {
      // Rebrickable expects form-urlencoded for some POSTs, but standard is JSON. 
      // If JSON fails, we may need URLSearchParams, but the API v3 supports application/json usually.
      // Wait, Rebrickable API docs specify sending data as standard POST body (JSON or Form).
      // We will send standard JSON. Wait, no, they actually prefer Form Data for some POST endpoints.
      // Let's use URLSearchParams to be safe for Rebrickable.
      if (method === 'POST' || method === 'PUT') {
        fetchOptions.headers = {
          'Authorization': `key ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        };
        fetchOptions.body = new URLSearchParams(options.body).toString();
      }
    }

    const res = await fetch(url, fetchOptions);

    if (res.ok) {
      if (method === 'DELETE') return {} as T; // DELETE often returns 204 No Content
      return res.json();
    }

    // Rate limited
    if (res.status === 429) {
      console.warn(`Rate limited by Rebrickable API. Retrying in ${Math.pow(2, i)} seconds...`);
      await delay(Math.pow(2, i) * 1000);
      continue;
    }

    let errMessage = res.statusText;
    try {
      const errBody = await res.json();
      errMessage = JSON.stringify(errBody);
    } catch (e) {}
    
    throw new RebrickableError(res.status, `Rebrickable API Error: ${errMessage}`);
  }

  throw new Error('Max retries reached for Rebrickable API.');
}

export interface SetList {
  id: number;
  is_buildable: boolean;
  name: string;
  num_sets: number;
}

export async function getSetLists(userToken: string): Promise<SetList[]> {
  const response = await fetchFromRebrickable<{ count: number; results: SetList[] }>(`/users/${userToken}/setlists/`);
  return response.results;
}

export async function addSetToList(userToken: string, listId: number, setNum: string, quantity: number = 1): Promise<void> {
  await fetchFromRebrickable(`/users/${userToken}/setlists/${listId}/sets/`, {
    method: 'POST',
    body: { set_num: setNum, quantity: quantity.toString() }
  });
}

export async function updateSetInList(userToken: string, listId: number, setNum: string, quantity: number): Promise<void> {
  await fetchFromRebrickable(`/users/${userToken}/setlists/${listId}/sets/${setNum}/`, {
    method: 'PUT',
    body: { quantity: quantity.toString() }
  });
}

export async function deleteSetFromList(userToken: string, listId: number, setNum: string): Promise<void> {
  await fetchFromRebrickable(`/users/${userToken}/setlists/${listId}/sets/${setNum}/`, {
    method: 'DELETE'
  });
}

export async function getUserSets(userToken: string): Promise<UserSet[]> {
  // Rebrickable API gets sets from user's lists.
  // /api/v3/users/{user_token}/sets/
  const response = await fetchFromRebrickable<{ count: number; results: UserSet[] }>(`/users/${userToken}/sets/`);
  return response.results;
}

export async function getThemes(): Promise<Theme[]> {
  // /api/v3/lego/themes/
  // The API is paginated, but for simplicity we fetch the first page, or we could fetch all if needed.
  // Often themes are ~700 items, pagination might be required.
  const response = await fetchFromRebrickable<{ count: number; results: Theme[] }>(`/lego/themes/?page_size=1000`);
  return response.results;
}

export async function getSetDetails(setNum: string): Promise<LegoSet> {
  return await fetchFromRebrickable<LegoSet>(`/lego/sets/${setNum}/`);
}
