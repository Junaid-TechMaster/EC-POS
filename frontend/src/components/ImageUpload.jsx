import { useRef, useState } from 'react';
import { Upload, Loader, X } from 'lucide-react';
import axios from '../utils/api';

const ImageUpload = ({ value, onChange, placeholder = 'Paste image URL or upload from device' }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const { data } = await axios.post('/api/upload', formData, { withCredentials: true });
      onChange(data.url || data.imageUrl || '');
    } catch {
      alert('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex-shrink-0 w-10 flex items-center justify-center text-gray-400 hover:text-red-500 border border-gray-200 rounded-xl transition-colors"
            title="Clear image"
          >
            <X size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors"
          title="Upload from device"
        >
          {uploading ? <Loader size={15} className="animate-spin" /> : <Upload size={15} />}
          <span className="hidden sm:inline">{uploading ? 'Uploading…' : 'Upload'}</span>
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-16 w-24 object-cover rounded-xl border border-gray-200"
          onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
        />
      )}
    </div>
  );
};

export default ImageUpload;
