import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function withAuth(Component: React.ComponentType, requiredPermissions?: string[]) {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter();
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      // Optional: call an API to verify permissions if needed
      // For now, just pass through; the API will enforce permission checks
    }, []);
    return <Component {...props} />;
  };
}