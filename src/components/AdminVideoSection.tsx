import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminVideoUpload from './AdminVideoUpload';
import AdminVideoManagement from './AdminVideoManagement';

const AdminVideoSection = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Tabs defaultValue="manage" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manage">Manage Videos</TabsTrigger>
        <TabsTrigger value="upload">Upload Video</TabsTrigger>
      </TabsList>
      
      <TabsContent value="manage" className="mt-6">
        <AdminVideoManagement refreshTrigger={refreshTrigger} />
      </TabsContent>
      
      <TabsContent value="upload" className="mt-6">
        <AdminVideoUpload onUploadSuccess={handleUploadSuccess} />
      </TabsContent>
    </Tabs>
  );
};

export default AdminVideoSection;