import { toast } from 'sonner';
import { ApiError } from './error-handler';

interface RequestOptions extends RequestInit {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    ...fetchOptions
  } = options;

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error || 'Request failed', {
        cause: error
      });
    }

    if (showSuccessToast) {
      toast.success(successMessage || 'Operation completed successfully');
    }

    return data as T;
  } catch (error) {
    if (showErrorToast) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred'
      );
    }
    throw error;
  }
}

// Helper functions for common HTTP methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  put: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),

  patch: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    }),
}; 