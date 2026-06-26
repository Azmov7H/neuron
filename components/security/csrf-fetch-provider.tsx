"use client";

import { useEffect } from 'react';

const CSRF_COOKIE_NAME = 'neuron_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_ENDPOINT = '/api/auth/csrf';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function readCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split('=')[1];
}

async function fetchCsrfToken() {
  const response = await window.fetch(CSRF_ENDPOINT, {
    credentials: 'same-origin',
  });
  if (!response.ok) {
    return null;
  }
  const payload = await response.json();
  return payload?.data?.csrfToken as string | null;
}

export function CsrfFetchProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const globalWindow = window as Window & { __neuronCsrfFetchPatched?: boolean };
    if (globalWindow.__neuronCsrfFetchPatched) {
      return;
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      const url = new URL(request.url, window.location.href);
      const isSameOrigin = url.origin === window.location.origin;

      if (
        isSameOrigin &&
        STATE_CHANGING_METHODS.includes(request.method.toUpperCase()) &&
        request.url !== new URL(CSRF_ENDPOINT, window.location.href).href
      ) {
        let csrfToken: string | null = readCookie(CSRF_COOKIE_NAME) ?? null;
        if (!csrfToken) {
          csrfToken = await fetchCsrfToken();
        }

        if (csrfToken) {
          request.headers.set(CSRF_HEADER_NAME, csrfToken);
        }
      }

      return originalFetch(request);
    };

    globalWindow.__neuronCsrfFetchPatched = true;
  }, []);

  return null;
}
