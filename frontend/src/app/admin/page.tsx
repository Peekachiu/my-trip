'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /admin has been merged into /dashboard. Redirect for backward compatibility.
export default function AdminRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);
    return null;
}
