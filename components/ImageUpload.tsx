
import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import Icon from './Icon';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ACCEPTED_IMAGE_TYPES } from '../constants';

interface ImageUploadProps {
  onImageSelect: (file: File | null, dataUrl: string | null) => void;
  imagePreviewUrl: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, imagePreviewUrl }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback((file: File | null) => {
    setError(null);
    setFileName(null);

    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError(`Invalid file type. Please upload: ${ACCEPTED_IMAGE_TYPES.join(', ')}.`);
        onImageSelect(null, null);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        onImageSelect(null, null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(file, reader.result as string);
        setFileName(file.name);
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        onImageSelect(null, null);
      };
      reader.readAsDataURL(file);
    } else {
      onImageSelect(null, null);
    }
  }, [onImageSelect]);

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(event.target.files ? event.target.files[0] : null);
  };

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileChange(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [handleFileChange]);

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };
  
  const handleRemoveImage = () => {
    setFileName(null);
    onImageSelect(null, null);
    // Reset file input value to allow re-uploading the same file
    const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };


  return (
    <div className="mb-6">
      <label htmlFor="image-upload-input" className="block text-sm font-medium text-gray-700 mb-2">
        Upload Design Image
      </label>
      <div
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors
          ${isDragging ? 'border-primary bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
          ${error ? 'border-red-500' : ''}`}
        onClick={() => document.getElementById('image-upload-input')?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          id="image-upload-input"
          type="file"
          className="hidden"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={onFileInputChange}
        />
        {imagePreviewUrl && fileName ? (
          <div className="flex flex-col items-center justify-center text-center p-2 h-full">
            <img src={imagePreviewUrl} alt="Preview" className="max-h-28 object-contain rounded mb-2" />
            <p className="text-sm font-medium text-gray-700 truncate max-w-full px-2">{fileName}</p>
            <button 
                onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }} 
                className="mt-1 text-xs text-red-500 hover:text-red-700 font-semibold"
            >
                Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <Icon name="fas fa-cloud-upload-alt" className="text-4xl text-gray-400 mb-3" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP (MAX. {MAX_FILE_SIZE_MB}MB)</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ImageUpload;
