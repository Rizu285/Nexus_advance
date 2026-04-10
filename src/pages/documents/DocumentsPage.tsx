import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Download,
  FileText,
  Filter,
  PenLine,
  Plus,
  Share2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

type DocumentStatus = 'Draft' | 'In Review' | 'Signed';

type ChamberDocument = {
  id: string;
  name: string;
  type: string;
  size: string;
  modifiedAt: string;
  status: DocumentStatus;
  shared: boolean;
  previewUrl?: string;
  mimeType?: string;
  signature?: string;
  source?: 'seed' | 'upload';
};

const seedDocuments: ChamberDocument[] = [
  {
    id: 'doc-1',
    name: 'Series A Term Sheet.pdf',
    type: 'PDF',
    size: '2.4 MB',
    modifiedAt: '2026-04-08T09:30:00Z',
    status: 'In Review',
    shared: true,
    previewUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mimeType: 'application/pdf',
    source: 'seed',
  },
  {
    id: 'doc-2',
    name: 'NDA Draft.docx',
    type: 'Document',
    size: '860 KB',
    modifiedAt: '2026-04-07T15:45:00Z',
    status: 'Draft',
    shared: false,
    source: 'seed',
  },
  {
    id: 'doc-3',
    name: 'Investment Agreement.pdf',
    type: 'PDF',
    size: '4.1 MB',
    modifiedAt: '2026-04-06T11:10:00Z',
    status: 'Signed',
    shared: true,
    previewUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mimeType: 'application/pdf',
    signature: 'Agreed by both parties',
    source: 'seed',
  },
];

const statusStyles: Record<DocumentStatus, 'primary' | 'warning' | 'success'> = {
  Draft: 'primary',
  'In Review': 'warning',
  Signed: 'success',
};

const statusDescriptions: Record<DocumentStatus, string> = {
  Draft: 'Prepared but not yet shared for review.',
  'In Review': 'Shared with the other party and awaiting action.',
  Signed: 'Fully executed and ready to archive.',
};

const createId = () => `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<ChamberDocument[]>(seedDocuments);
  const [activeDocumentId, setActiveDocumentId] = useState<string>(seedDocuments[0].id);
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'All'>('All');
  const [signatureName, setSignatureName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewInputRef = useRef<HTMLInputElement | null>(null);

  const activeDocument = documents.find((document) => document.id === activeDocumentId) ?? documents[0];

  const filteredDocuments = useMemo(() => {
    if (filterStatus === 'All') {
      return documents;
    }

    return documents.filter((document) => document.status === filterStatus);
  }, [documents, filterStatus]);

  useEffect(() => {
    if (!signatureName && activeDocument) {
      setSignatureName('');
    }
  }, [activeDocument, signatureName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    context.scale(dpr, dpr);
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.strokeStyle = '#0f172a';
    context.clearRect(0, 0, rect.width, rect.height);

    if (activeDocument?.signature) {
      const signatureImage = new Image();
      signatureImage.onload = () => {
        context.clearRect(0, 0, rect.width, rect.height);
        context.drawImage(signatureImage, 16, 16, rect.width - 32, rect.height - 32);
      };
      signatureImage.src = activeDocument.signature;
    }
  }, [activeDocument]);

  const getPointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const beginStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    canvas.setPointerCapture(event.pointerId);
    const { x, y } = getPointerPosition(event);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const continueStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const { x, y } = getPointerPosition(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.releasePointerCapture(event.pointerId);
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    setSignatureName('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeDocument) return;

    const dataUrl = canvas.toDataURL('image/png');
    setDocuments((current) =>
      current.map((document) =>
        document.id === activeDocument.id
          ? {
              ...document,
              signature: dataUrl,
              status: 'Signed',
              modifiedAt: new Date().toISOString(),
            }
          : document
      )
    );
  };

  const handleStatusChange = (documentId: string, status: DocumentStatus) => {
    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status,
              modifiedAt: new Date().toISOString(),
            }
          : document
      )
    );
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const isPdf = file.type === 'application/pdf';

    const newDocument: ChamberDocument = {
      id: createId(),
      name: file.name,
      type: isPdf ? 'PDF' : file.type.startsWith('image/') ? 'Image' : 'Document',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      modifiedAt: new Date().toISOString(),
      status: 'Draft',
      shared: false,
      previewUrl,
      mimeType: file.type,
      source: 'upload',
    };

    setDocuments((current) => [newDocument, ...current]);
    setActiveDocumentId(newDocument.id);
    event.target.value = '';
  };

  const activePreviewType = activeDocument?.mimeType || activeDocument?.type;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
          <p className="text-gray-600">
            Upload, review, and sign deal documents with a simple mock e-sign workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<Upload size={18} />}
            onClick={() => previewInputRef.current?.click()}
          >
            Upload Document
          </Button>
          <input
            ref={previewInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx,.xls,.xlsx,image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Document Queue</h2>
            <Badge variant="primary">{documents.length} files</Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={filterStatus === 'All' ? 'primary' : 'outline'} onClick={() => setFilterStatus('All')}>
                All
              </Button>
              {(['Draft', 'In Review', 'Signed'] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filterStatus === status ? 'primary' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredDocuments.map((document) => (
                <button
                  key={document.id}
                  onClick={() => setActiveDocumentId(document.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    document.id === activeDocumentId
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary-100 p-2 text-primary-700">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-900">{document.name}</h3>
                        {document.shared && <Badge variant="secondary" size="sm">Shared</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {document.type} · {document.size} · {format(new Date(document.modifiedAt), 'MMM d, yyyy')}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant={statusStyles[document.status]} size="sm">
                          {document.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{statusDescriptions[document.status]}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Preview Chamber</h2>
                <p className="text-sm text-gray-500">Inspect PDFs, images, and uploaded documents before signing.</p>
              </div>
              {activeDocument && (
                <Badge variant={statusStyles[activeDocument.status]}> {activeDocument.status} </Badge>
              )}
            </CardHeader>

            <CardBody className="space-y-4">
              {activeDocument ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{activeDocument.name}</h3>
                      <p className="text-sm text-gray-500">
                        {activeDocument.type} · {activeDocument.size} · Modified {format(new Date(activeDocument.modifiedAt), 'PP p')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-[170px]">
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Status</label>
                        <select
                          value={activeDocument.status}
                          onChange={(event) => handleStatusChange(activeDocument.id, event.target.value as DocumentStatus)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        >
                          <option value="Draft">Draft</option>
                          <option value="In Review">In Review</option>
                          <option value="Signed">Signed</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <Button variant="ghost" size="sm" className="p-2" aria-label="Download">
                          <Download size={18} />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2" aria-label="Share">
                          <Share2 size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
                    <div className="rounded-2xl border border-gray-200 bg-[#fbfbfc] p-4 shadow-sm">
                      {activePreviewType === 'application/pdf' ? (
                        <div className="flex min-h-[560px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-primary-100 p-3 text-primary-700">
                                <FileText size={24} />
                              </div>
                              <div>
                                <h3 className="text-base font-semibold text-gray-900">PDF Preview</h3>
                                <p className="text-sm text-gray-500">Mock render for {activeDocument.name}</p>
                              </div>
                            </div>
                            {activeDocument.previewUrl && (
                              <a
                                href={activeDocument.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-primary-600 hover:text-primary-500"
                              >
                                Open file
                              </a>
                            )}
                          </div>

                          <div className="mt-5 grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.9fr]">
                            <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                              <div className="space-y-3">
                                <div className="h-3 w-3/4 rounded-full bg-gray-200" />
                                <div className="h-3 w-full rounded-full bg-gray-200" />
                                <div className="h-3 w-5/6 rounded-full bg-gray-200" />
                                <div className="h-3 w-2/3 rounded-full bg-gray-200" />
                              </div>

                              <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-4">
                                <p className="text-sm font-medium text-gray-800">
                                  {activeDocument.signature || 'Document ready for review and signature.'}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  This chamber preview simulates the PDF layout without relying on an external viewer.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="rounded-xl border border-gray-200 bg-white p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Type</p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">{activeDocument.type}</p>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Signer</p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                  {signatureName.trim() || 'Awaiting signer name'}
                                </p>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">State</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant={statusStyles[activeDocument.status]} size="sm">
                                    {activeDocument.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{statusDescriptions[activeDocument.status]}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activePreviewType?.startsWith('image/') ? (
                        <img
                          src={activeDocument.previewUrl}
                          alt={activeDocument.name}
                          className="h-[560px] w-full rounded-xl border border-gray-200 bg-white object-contain"
                        />
                      ) : (
                        <div className="flex min-h-[560px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white text-center shadow-sm">
                          <FileText size={48} className="text-gray-400" />
                          <h3 className="mt-4 text-lg font-semibold text-gray-900">Preview not available</h3>
                          <p className="mt-2 max-w-sm text-sm text-gray-600">
                            This file can still be stored, reviewed, and signed in the chamber.
                          </p>
                          <p className="mt-3 text-xs text-gray-500">
                            File type: {activeDocument.mimeType || activeDocument.type}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Card className="border border-gray-200 bg-white shadow-sm">
                        <CardHeader className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900">Signature</h3>
                          <Badge variant="accent">Mock pad</Badge>
                        </CardHeader>
                        <CardBody className="space-y-4">
                          <Input
                            value={signatureName}
                            onChange={(event) => setSignatureName(event.target.value)}
                            label="Signer name"
                            placeholder="Type signer name"
                            fullWidth
                          />

                          <div className="rounded-2xl border border-gray-300 bg-white p-3 shadow-sm">
                            <canvas
                              ref={canvasRef}
                              className="h-44 w-full touch-none rounded-xl bg-[linear-gradient(to_right,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:18px_18px]"
                              onPointerDown={beginStroke}
                              onPointerMove={continueStroke}
                              onPointerUp={endStroke}
                              onPointerLeave={endStroke}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" leftIcon={<X size={16} />} onClick={clearSignature}>
                              Clear
                            </Button>
                            <Button leftIcon={<PenLine size={16} />} onClick={saveSignature}>
                              Apply Signature
                            </Button>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Signing status</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {signatureName.trim() || 'Awaiting signer name'}
                            </p>
                            <p className="mt-2 text-sm text-gray-600">Current document: {activeDocument.status}</p>
                          </div>
                        </CardBody>
                      </Card>

                      <Card className="border border-gray-200 bg-white shadow-sm">
                        <CardHeader>
                          <h3 className="text-base font-medium text-gray-900">Workflow legend</h3>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <span className="text-sm text-gray-600">Draft</span>
                            <Badge variant="primary" size="sm">Prepare</Badge>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <span className="text-sm text-gray-600">In Review</span>
                            <Badge variant="warning" size="sm">Counterparty reviewing</Badge>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <span className="text-sm text-gray-600">Signed</span>
                            <Badge variant="success" size="sm">Finalized</Badge>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center">
                  <Plus size={40} className="text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">No document selected</h3>
                  <p className="mt-2 max-w-md text-sm text-gray-600">
                    Upload a contract, term sheet, or proposal to open the chamber preview.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Chamber Notes</h2>
              <Badge variant="secondary">Deal-ready</Badge>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-primary-50 p-4">
                <Filter size={18} className="text-primary-700" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Draft</h3>
                <p className="mt-1 text-sm text-gray-600">Documents being prepared or uploaded.</p>
              </div>
              <div className="rounded-xl bg-warning-50 p-4">
                <PenLine size={18} className="text-warning-700" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">In Review</h3>
                <p className="mt-1 text-sm text-gray-600">Waiting for stakeholder review and edits.</p>
              </div>
              <div className="rounded-xl bg-success-50 p-4">
                <CheckCircle2 size={18} className="text-success-700" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Signed</h3>
                <p className="mt-1 text-sm text-gray-600">Finalized documents ready for archive.</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
