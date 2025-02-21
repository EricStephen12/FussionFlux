import { QueryConstraint, limit, orderBy, startAfter, Query, getDocs } from 'firebase/firestore';

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  cursor?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor?: any;
}

export class PaginationService {
  private defaultLimit = 10;
  private maxLimit = 100;

  getQueryConstraints(params: PaginationParams): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];
    const itemsLimit = Math.min(params.limit || this.defaultLimit, this.maxLimit);

    if (params.orderBy) {
      constraints.push(orderBy(params.orderBy, params.orderDirection || 'desc'));
    }

    if (params.cursor) {
      constraints.push(startAfter(params.cursor));
    }

    constraints.push(limit(itemsLimit));
    return constraints;
  }

  async paginate<T>(
    query: Query,
    params: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    const itemsLimit = Math.min(params.limit || this.defaultLimit, this.maxLimit);

    // Get total count
    const totalSnapshot = await getDocs(query);
    const total = totalSnapshot.size;

    // Apply pagination constraints
    const constraints = this.getQueryConstraints(params);
    const paginatedQuery = query.withConstraints(constraints);
    const snapshot = await getDocs(paginatedQuery);

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    const totalPages = Math.ceil(total / itemsLimit);
    const currentPage = params.page || 1;
    const hasMore = currentPage < totalPages;
    const nextCursor = hasMore ? snapshot.docs[snapshot.docs.length - 1] : undefined;

    return {
      data,
      total,
      currentPage,
      totalPages,
      hasMore,
      nextCursor,
    };
  }

  calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  async paginateArray<T>(
    array: T[],
    params: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    const itemsLimit = Math.min(params.limit || this.defaultLimit, this.maxLimit);
    const currentPage = params.page || 1;
    const skip = this.calculateSkip(currentPage, itemsLimit);

    const total = array.length;
    const totalPages = Math.ceil(total / itemsLimit);
    const hasMore = currentPage < totalPages;

    const data = array.slice(skip, skip + itemsLimit);

    return {
      data,
      total,
      currentPage,
      totalPages,
      hasMore,
    };
  }
}

export const paginationService = new PaginationService(); 