import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';

export function usePermission(permissionName: string): boolean {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const res = await fetch(`/api/auth/check-permission?permission=${permissionName}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        setHasPermission(data.hasPermission);
      } catch (err) {
        console.error(err);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };
    checkPermission();
  }, [permissionName]);

  return hasPermission;
}