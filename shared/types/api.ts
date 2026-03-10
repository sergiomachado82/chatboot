export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
  services: {
    database: boolean;
    redis: boolean;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
