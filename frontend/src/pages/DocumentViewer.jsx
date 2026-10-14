import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { FileText } from 'lucide-react';

const DocumentViewer = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Document Viewer"
        subtitle="Detailed document metadata and page breakdown."
      />
      <EmptyState
        icon={FileText}
        title="Document Details Viewer"
        description="Inspect document status, page count, and retrieved chunk context."
      />
    </PageContainer>
  );
};

export default DocumentViewer;
