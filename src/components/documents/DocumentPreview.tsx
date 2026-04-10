import React from 'react';
import { FileText, FileScan, Eye } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card, CardBody } from '../ui/Card';

export interface ChamberDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'Draft' | 'In Review' | 'Signed';
  shared: boolean;
  previewUrl?: string;
  signatureDataUrl?: string;
  notes?: string;
  owner: string;
  lastModified: string;
}

interface DocumentPreviewProps {
  document: ChamberDocument | null;
}

const statusVariant = {
  Draft: 'warning' as const,
  'In Review': 'secondary' as const,
  Signed: 'success' as const,
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
  if (!document) {
    return (
      <Card className="h-full">
        <CardBody className="flex h-full min-h-[28rem] items-center justify-center text-center">
          <div>
            <Eye size={42} className="mx-auto text-slate-400" />
            <h3 className="mt-3 text-lg font-semibold text-slate-900">Preview a document</h3>
            <p className="mt-1 text-sm text-slate-500">Select or upload a deal or contract to inspect it here.</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="h-full border-slate-200">
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary-600" />
              <h3 className="font-semibold text-slate-900">{document.name}</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {document.type} • {document.size} • Updated {document.lastModified}
            </p>
          </div>

          <Badge variant={statusVariant[document.status]}>{document.status}</Badge>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {document.previewUrl && document.type.toLowerCase().includes('pdf') ? (
            <iframe
              title={document.name}
              src={document.previewUrl}
              className="h-[28rem] w-full rounded-xl border border-slate-200 bg-white"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-slate-700">
                  <FileScan size={18} />
                  <span className="text-sm font-medium">Document chamber view</span>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="h-3 w-3/4 rounded-full bg-slate-200" />
                  <div className="h-3 w-full rounded-full bg-slate-200" />
                  <div className="h-3 w-5/6 rounded-full bg-slate-200" />
                  <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                  <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                    <p className="font-medium text-slate-800">{document.notes || 'Preview ready for review and signature.'}</p>
                    <p className="mt-1 text-xs text-slate-500">This mock preview represents the contract content in a readable layout.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Owner</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{document.owner}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Shared</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{document.shared ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Signature</p>
                  {document.signatureDataUrl ? (
                    <img src={document.signatureDataUrl} alt="Signature" className="mt-2 h-16 w-full object-contain" />
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">Not signed yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
