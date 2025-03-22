'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersIcon } from '@heroicons/react/24/outline';

export default function ContactsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-6 w-6" />
            Contacts Management
          </CardTitle>
          <CardDescription>
            Coming Soon - Manage your contacts and subscribers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              We're working on bringing you a powerful contacts management system.
            </p>
            <p className="text-gray-500">
              Stay tuned for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 