'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud, ImageIcon, Scissors, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ImageCropModal } from './ImageCropModal';
import { cn } from '@/lib/utils';

export interface StagedFile {
    id: string;
    file: File;
    previewUrl: string;
}

interface ImageDropzoneProps {
    files: StagedFile[];
    setFiles: React.Dispatch<React.SetStateAction<StagedFile[]>>;
    existingUrls?: string[];
    setExistingUrls?: React.Dispatch<React.SetStateAction<string[]>>;
    maxFiles?: number;
}

export default function ImageDropzone({ files, setFiles, existingUrls = [], setExistingUrls, maxFiles = 10 }: ImageDropzoneProps) {
    const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageIdx: number | null }>({
        isOpen: false,
        imageIdx: null,
    });

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

        const currentTotal = files.length + existingUrls.length;
        const remainingSlots = maxFiles - currentTotal;

        if (remainingSlots <= 0) {
            toast.error(`Maximum ${maxFiles} files allowed.`);
            return;
        }

        let processable = acceptedFiles;
        if (acceptedFiles.length > remainingSlots) {
            toast.error(`Maximum ${maxFiles} files allowed. Truncating excess.`);
            processable = acceptedFiles.slice(0, remainingSlots);
        }

        const newStaged = processable.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        setFiles(prev => [...prev, ...newStaged]);
    }, [files, existingUrls, maxFiles, setFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxSize: 5 * 1024 * 1024,
        maxFiles: maxFiles
    });

    const removeFile = (id: string) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
            return prev.filter(f => f.id !== id);
        });
    };

    const removeExistingUrl = (url: string) => {
        if (setExistingUrls) {
            setExistingUrls(prev => prev.filter(u => u !== url));
        }
    };

    const openCrop = (idx: number) => {
        setCropModal({ isOpen: true, imageIdx: idx });
    };

    const handleCropComplete = (blob: Blob) => {
        if (cropModal.imageIdx === null) return;

        const idx = cropModal.imageIdx;
        const currentFile = files[idx];
        const newFile = new File([blob], currentFile.file.name, { type: 'image/jpeg' });

        // Cleanup old preview
        URL.revokeObjectURL(currentFile.previewUrl);

        const newPreview = URL.createObjectURL(newFile);

        setFiles(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], file: newFile, previewUrl: newPreview };
            return next;
        });

        toast.success("Image framed successfully!");
    };

    // Cleanup all object URLs on unmount
    useEffect(() => {
        return () => {
            files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        };
    }, []);

    return (
        <div className="space-y-6 w-full">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[220px] bg-gray-50/50 overflow-hidden",
                    isDragActive ? "border-[#004d00] bg-[#004d00]/5 ring-4 ring-[#004d00]/5" : "border-gray-200 hover:border-[#004d00] hover:bg-white shadow-sm hover:shadow-md"
                )}
            >
                <input {...getInputProps()} />
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className={cn("w-10 h-10", isDragActive ? "text-[#004d00]" : "text-gray-400")} />
                </div>
                <div className="space-y-1">
                    <p className="text-base font-bold text-gray-900">
                        Drop your homestay photos here
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                        or <span className="text-[#004d00] underline underline-offset-4">browse files</span> from your computer
                    </p>
                </div>
                <p className="text-xs text-gray-400 mt-4 font-semibold uppercase tracking-wider">
                    JPG, PNG or WEBP • MAX {maxFiles} PHOTOS • 5MB EACH
                </p>
            </div>

            {(files.length > 0 || existingUrls.length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Render Existing URLs */}
                    {existingUrls.map((url, index) => (
                        <div key={`existing-${index}`} className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 transition-all hover:shadow-lg">
                            <img src={url} alt="Existing" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-10 w-10 rounded-full shadow-xl hover:scale-110 transition-all"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeExistingUrl(url); }}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Render Local Staged Files */}
                    {files.map((staged, index) => (
                        <div key={staged.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 transition-all hover:shadow-lg">
                            <img src={staged.previewUrl} alt="Staged" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="h-10 w-10 rounded-full shadow-xl bg-white text-gray-900 hover:bg-gray-100 hover:scale-110 transition-all"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openCrop(index); }}
                                    title="Frame Photo"
                                >
                                    <Scissors className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-10 w-10 rounded-full shadow-xl hover:scale-110 transition-all"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(staged.id); }}
                                    title="Remove"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                                <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-gray-700 truncate shadow-sm">
                                    {(staged.file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add More Button */}
                    {(files.length + existingUrls.length) < maxFiles && (
                        <div {...getRootProps()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-[#004d00]/50 hover:bg-gray-50 transition-all cursor-pointer group">
                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#004d00] transition-colors" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-[#004d00]">Add More</span>
                        </div>
                    )}
                </div>
            )}

            {cropModal.isOpen && cropModal.imageIdx !== null && (
                <ImageCropModal
                    isOpen={cropModal.isOpen}
                    onClose={() => setCropModal({ isOpen: false, imageIdx: null })}
                    imageSrc={files[cropModal.imageIdx].previewUrl}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    );
}
