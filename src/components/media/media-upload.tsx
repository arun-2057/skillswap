'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Paperclip, 
  Image as ImageIcon, 
  File, 
  Upload, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface MediaUploadProps {
  onUpload: (files: File[]) => void;
  conversationId?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

interface UploadStatus {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function MediaUpload({
  onUpload,
  conversationId,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf', 'text/plain'],
  disabled = false,
  className = '',
}: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('/*')) {
        const mimeType = file.type.split('/')[0] + '/*';
        return file.type.startsWith(type.replace('/*', '')) || mimeType === type;
      }
      return file.type === type;
    });

    if (!isValidType) {
      return 'File type not supported';
    }

    return null;
  }, [acceptedTypes, maxSize]);

  const handleFileSelect = useCallback((newFiles: FileList) => {
    if (disabled) return;

    const filesArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    filesArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Check total files limit
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }

    if (errors.length > 0) {
      // Show errors as toast or alert
      console.error('File validation errors:', errors);
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      setUploadStatus(prev => [
        ...prev,
        ...validFiles.map(file => ({
          file,
          progress: 0,
          status: 'pending' as const,
        }))
      ]);
    }
  }, [files, maxFiles, validateFile, disabled]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadStatus(prev => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFile = useCallback(async (file: File, index: number) => {
    if (!conversationId) {
      setUploadStatus(prev => prev.map((status, i) =>
        i === index ? { ...status, status: 'error', error: 'Conversation ID required' } : status
      ));
      return;
    }

    setUploadStatus(prev => prev.map((status, i) =>
      i === index ? { ...status, status: 'uploading' } : status
    ));

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadStatus(prev => prev.map((status, i) =>
          i === index ? { ...status, progress: Math.min(status.progress + 10, 100) } : status
        ));
      }, 200);

      // Upload file
      const response = await fetch(`/api/conversations/${conversationId}/messages/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadStatus(prev => prev.map((status, i) =>
        i === index ? { ...status, status: 'completed', progress: 100 } : status
      ));

      // Call onUpload callback with the uploaded file
      onUpload([file]);

    } catch (error) {
      setUploadStatus(prev => prev.map((status, i) =>
        i === index ? {
          ...status,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        } : status
      ));
    }
  }, [conversationId, onUpload]);

  const uploadAllFiles = useCallback(async () => {
    uploadStatus.forEach((status, index) => {
      if (status.status === 'pending') {
        uploadFile(status.file, index);
      }
    });
  }, [uploadStatus, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="size-4" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="size-4" />;
    } else {
      return <File className="size-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Auto-upload when files are added
  useEffect(() => {
    if (files.length > 0) {
      uploadAllFiles();
    }
  }, [files, uploadAllFiles]);

  // Notify parent when all uploads are complete
  useEffect(() => {
    const allCompleted = uploadStatus.length > 0 && 
      uploadStatus.every(status => status.status === 'completed' || status.status === 'error');
    
    if (allCompleted) {
      const successfulFiles = uploadStatus
        .filter(status => status.status === 'completed')
        .map(status => status.file);
      
      if (successfulFiles.length > 0) {
        onUpload(successfulFiles);
      }
    }
  }, [uploadStatus, onUpload]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Paperclip className="size-8 mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {disabled ? 'Upload disabled' : 'Drop files here or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} files, {maxSize}MB each. Supported: {acceptedTypes.join(', ')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const status = uploadStatus[index];
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {status && (
                    <div className="mt-1">
                      {status.status === 'uploading' && (
                        <div className="space-y-1">
                          <Progress value={status.progress} className="h-1" />
                          <p className="text-xs text-muted-foreground">
                            Uploading... {status.progress}%
                          </p>
                        </div>
                      )}
                      
                      {status.status === 'completed' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="size-3" />
                          <span className="text-xs">Uploaded</span>
                        </div>
                      )}
                      
                      {status.status === 'error' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="size-3" />
                          <span className="text-xs">{status.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="shrink-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={uploadAllFiles}
            disabled={uploadStatus.some(status => status.status === 'uploading')}
            size="sm"
          >
            <Upload className="size-4 mr-1" />
            Upload All
          </Button>
        </div>
      )}
    </div>
  );
}

// Video icon component
const Video = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
  </svg>
);