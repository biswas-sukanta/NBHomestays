import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageDropzoneProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    existingUrls?: string[];
    setExistingUrls?: React.Dispatch<React.SetStateAction<string[]>>;
    maxFiles?: number;
}

export default function ImageDropzone({ files, setFiles, existingUrls = [], setExistingUrls, maxFiles = 10 }: ImageDropzoneProps) {
    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        if (fileRejections.length > 0) {
            fileRejections.forEach(rejection => {
                rejection.errors.forEach((error: any) => {
                    if (error.code === 'too-many-files') toast.error(`Maximum ${maxFiles} files allowed.`);
                    else if (error.code === 'file-too-large') toast.error(`${rejection.file.name} is too large (Max 5MB).`);
                    else toast.error(error.message);
                });
            });
            return;
        }

        setFiles(prev => {
            const currentTotal = prev.length + existingUrls.length;
            const remainingSlots = maxFiles - currentTotal;
            if (remainingSlots <= 0) {
                toast.error(`Maximum ${maxFiles} files allowed.`);
                return prev;
            }

            let newFiles = acceptedFiles;
            if (acceptedFiles.length > remainingSlots) {
                toast.error(`Maximum ${maxFiles} files allowed. Truncating excess.`);
                newFiles = acceptedFiles.slice(0, remainingSlots);
            }
            return [...prev, ...newFiles];
        });
    }, [setFiles, existingUrls, maxFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: maxFiles
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingUrl = (index: number) => {
        if (setExistingUrls) {
            setExistingUrls(prev => prev.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-4 w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[160px]
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary bg-gray-50'}`}
            >
                <input {...getInputProps()} />
                <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
                <p className="text-sm font-medium text-gray-700">
                    <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    SVG, PNG, JPG or WEBP (Max {maxFiles} files, 5MB each)
                </p>
            </div>

            {(files.length > 0 || existingUrls.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                    {/* Render Existing URLs */}
                    {existingUrls.map((url, index) => (
                        <div key={`existing-${index}`} className="relative group rounded-lg overflow-hidden border border-border shadow-sm aspect-square bg-gray-100 flex items-center justify-center">
                            <img
                                src={url}
                                alt={`Existing Preview ${index}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 rounded-full shadow-lg"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removeExistingUrl(index);
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Render Local Files */}
                    {files.map((file, index) => (
                        <div key={`local-${index}`} className="relative group rounded-lg overflow-hidden border border-border shadow-sm aspect-square bg-gray-100 flex items-center justify-center">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index}`}
                                className="w-full h-full object-cover"
                                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 rounded-full shadow-lg"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
