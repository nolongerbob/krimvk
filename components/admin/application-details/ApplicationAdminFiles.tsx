'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Upload, X } from 'lucide-react';
import { fileHrefForStoredUrl } from '@/lib/file-url';

type ApplicationFile = {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date | string;
};

type Props = {
  applicationId: string;
  active: boolean;
};

export function ApplicationAdminFiles({ applicationId, active }: Props) {
  const [adminFiles, setAdminFiles] = useState<ApplicationFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) {
      void fetchAdminFiles();
    }
  }, [active, applicationId]);

  const fetchAdminFiles = async () => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/files`);
      if (response.ok) {
        const result = await response.json();
        setAdminFiles(result.files || []);
      }
    } catch (error) {
      console.error('Error fetching admin files:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/admin/applications/${applicationId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAdminFiles((prev) => [...prev, result.file]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при загрузке файла');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/applications/${applicationId}/files?fileId=${fileId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setAdminFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при удалении файла');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Ошибка при удалении файла');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Документы, загруженные администратором ({adminFiles.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id={`file-upload-${applicationId}`}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Загрузка...' : 'Загрузить документ'}
            </Button>
          </div>

          {adminFiles.length > 0 && (
            <div className="space-y-2">
              {adminFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                >
                  <a
                    href={fileHrefForStoredUrl(file.filePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline flex-1"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{file.fileName}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
