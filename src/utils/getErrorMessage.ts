import { AxiosError } from 'axios';

interface ApiError {
  success: false;
  error: string;
  code: string;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiError;
    return data.error ?? 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
