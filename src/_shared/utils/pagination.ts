import { ParsedQs } from 'qs';

export interface PaginationQuery {
  limit: number;
  page: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ADMIN_MAX_LIMIT = 500; // Higher limit for admins

export function buildPagination(query: ParsedQs, isAdmin: boolean = false): PaginationQuery {
  const maxLimit = isAdmin ? ADMIN_MAX_LIMIT : MAX_LIMIT;
  const rawLimit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : DEFAULT_LIMIT;
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(maxLimit, rawLimit)) : DEFAULT_LIMIT;

  const rawPage = typeof query.page === 'string' ? parseInt(query.page, 10) : 1;
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;

  const skip = (page - 1) * limit;

  const sortParam = typeof query.sort === 'string' ? query.sort : '-createdAt';
  const sort: Record<string, 1 | -1> = {};

  sortParam
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      if (token.startsWith('-')) {
        sort[token.substring(1)] = -1;
      } else if (token.startsWith('+')) {
        sort[token.substring(1)] = 1;
      } else {
        sort[token] = 1;
      }
    });

  if (!Object.keys(sort).length) {
    sort.createdAt = -1;
  }

  return { limit, page, skip, sort };
}

