import React, { useState, useCallback, ChangeEvent, DragEvent, useRef, useEffect } from 'react';
import Icon from './Icon'; // Assurez-vous que ce composant Icon existe
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ACCEPTED_IMAGE_TYPES } from '../constants'; // Assurez-vous que ces constantes existent

interface ImageUploadProps {
  onImageSelect: (file: File | null, dataUrl: string | null) => void;
  imagePreviewUrl: string | null;
  hideLabel?: boolean;
  mode?: 'paste' | 'upload';
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, imagePreviewUrl, hideLabel, mode = 'upload' }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((file: File | null) => {
    setError(null);

    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError(`Type de fichier invalide. Veuillez utiliser : ${ACCEPTED_IMAGE_TYPES.join(', ')}.`);
        onImageSelect(null, null);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`Fichier trop volumineux. La taille maximale est de ${MAX_FILE_SIZE_MB}MB.`);
        onImageSelect(null, null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(file, reader.result as string);
      };
      reader.onerror = () => {
        setError('Échec de la lecture du fichier.');
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

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Empêcher le click si on est en mode paste uniquement
    if (mode === 'paste') {
      event.preventDefault();
      return;
    }
    
    // Empêcher le click si on clique sur des éléments interactifs
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('.group')) {
      return;
    }
    
    fileInputRef.current?.click();
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

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);
  
  const handleRemoveImage = (event: React.MouseEvent) => {
    event.stopPropagation();
    onImageSelect(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // CORRECTION : Le collage (paste) est maintenant activé pour tous les modes.
  // La condition 'if (mode !== 'paste')' a été retirée pour permettre le collage
  // que le composant soit en mode 'upload' ou 'paste'.
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.clipboardData) {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              handleFileChange(file);
              event.preventDefault(); // Empêche d'autres actions de collage
              break;
            }
          }
        }
      }
    };
    // L'écouteur est ajouté au document entier pour une meilleure expérience utilisateur
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleFileChange]); // La dépendance 'mode' a été retirée car inutile

  // Forcer le focus sur la zone d'upload en mode paste au montage
  useEffect(() => {
    if (mode === 'paste' && uploadRef.current) {
      uploadRef.current.focus();
    }
  }, [mode]);

  return (
    <div className="mb-6">
      {!hideLabel && (
        <label htmlFor="image-upload-input" className="block text-sm font-medium text-gray-700 mb-2">
          Upload Design Image
        </label>
      )}
      <div
        ref={uploadRef}
        tabIndex={0}
        className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-colors
          ${mode === 'upload' ? 'cursor-pointer' : 'cursor-default'}
          ${isDragging ? 'border-primary bg-indigo-50' : 'border-gray-300 bg-gray-50'}
          ${mode === 'upload' && !isDragging ? 'hover:bg-gray-100' : ''}
          ${error ? 'border-red-500' : ''}`}
        onClick={handleClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        aria-label={mode === 'paste' ? 'Paste or drag image here' : 'Click to upload, drag or paste image'}
        role="button"
      >
        <div className="absolute top-2 left-2 z-20 group">
          <Icon name="fas fa-info-circle" className="text-lg text-gray-400 cursor-help" />
          <div className="hidden group-hover:block absolute left-6 top-0 bg-white border border-gray-300 rounded shadow-md px-3 py-2 text-xs text-gray-700 w-56 z-30">
            {mode === 'paste'
              ? 'Collez (Ctrl+V) ou glissez-déposez une image.'
              : 'Cliquez pour sélectionner une image, glissez-déposez ou collez (Ctrl+V) une image.'}
          </div>
        </div>

        <input
          ref={fileInputRef}
          id="image-upload-input"
          type="file"
          className="hidden"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={onFileInputChange}
        />

        {imagePreviewUrl ? (
          <div className="relative flex flex-col items-center justify-center text-center p-2 h-full w-full">
            <img src={imagePreviewUrl} alt="Preview" className="max-h-40 w-full object-contain rounded mb-2" />
            <button 
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xl z-10 bg-white rounded-full p-1 shadow-md" 
              aria-label="Remove image"
              type="button"
            >
              <Icon name="fas fa-trash" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <Icon name="fas fa-cloud-upload-alt" className="text-4xl text-gray-400 mb-3" />
            <p className="mb-2 text-sm text-gray-500 flex items-center justify-center gap-1">
              {mode === 'paste' ? (
                <>
                  <span className="font-semibold">Paste</span> or drag & drop
                  <span title="Paste an image (Ctrl+V)"><Icon name="fas fa-clipboard" className="text-base text-gray-400 ml-1" /></span>
                </>
              ) : (
                <>
                  <span className="font-semibold">Click to upload</span> or drag & drop or
                  <span className="underline flex items-center gap-1">
                    paste
                    <span title="Paste an image (Ctrl+V)"><Icon name="fas fa-clipboard" className="text-base text-gray-400 ml-1" /></span>
                  </span>
                </>
              )}
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