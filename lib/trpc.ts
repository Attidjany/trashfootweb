import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/backend/trpc/app-router';
import superjson from 'superjson';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In the browser, use relative URL
    return '';
  }
  // For SSR, you might want to use an absolute URL
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
};

// Check if backend is available
let backendAvailable = false;
const checkBackend = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/`, { 
      method: 'GET',
      timeout: 3000 
    } as any);
    backendAvailable = response.ok;
    console.log('Backend availability check:', backendAvailable);
  } catch (error) {
    backendAvailable = false;
    console.log('Backend not available:', error);
  }
};

// Check backend availability on startup
checkBackend();

const trpcUrl = `${getBaseUrl()}/api/trpc`;
console.log('TRPC URL:', trpcUrl);

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...options?.headers,
            },
          });
          
          clearTimeout(timeoutId);
          
          // Check if response is HTML (error page)
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            console.error('Received HTML response instead of JSON. Backend might not be running.');
            throw new Error('Backend server is not responding correctly. Please check if the server is running.');
          }
          
          return response;
        } catch (error) {
          console.error('tRPC fetch error:', error);
          // Mark backend as unavailable for future requests
          backendAvailable = false;
          throw error;
        }
      },
    }),
  ],
});