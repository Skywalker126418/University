import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic data fetching hook with loading, error, and refetch support.
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} deps - Dependencies to re-fetch on change
 * @param {Object} options - { immediate: bool, initialData: any }
 */
export const useApi = (fetchFn, deps = [], options = {}) => {
  const { immediate = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current(...args);
      if (isMountedRef.current) {
        setData(result);
      }
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.message || err.message || 'An error occurred');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps); // eslint-disable-line

  return { data, isLoading, error, refetch: execute, setData };
};
