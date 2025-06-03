import { useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { exportPrivateKey, importPrivateKey, hasPrivateKey } from '../lib/keyStorage';
import { Download, Upload, Lock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const E2EEKeyManagement = () => {
  const { authUser } = useAuthStore();
  const fileInputRef = useRef(null);
  const [hasKey, setHasKey] = useState(() => {
    return authUser && hasPrivateKey(authUser._id);
  });

  const handleExportKey = () => {
    if (!authUser) return;
    
    try {
      exportPrivateKey(authUser._id, authUser.fullName);
      toast.success('Private key exported successfully');
    } catch (error) {
      console.error('Error exporting private key:', error);
      toast.error('Failed to export private key');
    }
  };

  const handleImportKey = async (e) => {
    const file = e.target.files[0];
    if (!file || !authUser) return;

    try {
      await importPrivateKey(file, authUser._id);
      toast.success('Private key imported successfully');
      setHasKey(true);
    } catch (error) {
      console.error('Error importing private key:', error);
      toast.error('Failed to import private key');
    }
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="p-4 border border-base-300 rounded-lg mt-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Lock className="mr-2" size={18} />
        End-to-End Encryption Keys
      </h2>

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${hasKey ? 'bg-green-500' : 'bg-amber-500'}`}></div>
          <span>Status: {hasKey ? 'Private Key Found' : 'No Private Key Found'}</span>
        </div>
        
        {!hasKey && (
          <div className="text-sm flex items-start mt-2 p-2 bg-amber-50 text-amber-800 rounded">
            <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <p>
              You don't have a private key in this browser. If you've used E2EE before, 
              import your key to decrypt past messages. Otherwise, encrypted messages will 
              be unreadable.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExportKey}
          disabled={!hasKey}
          className="btn btn-outline btn-sm flex items-center gap-2"
        >
          <Download size={16} />
          Export Private Key
        </button>

        <button
          onClick={triggerFileSelect}
          className="btn btn-outline btn-sm flex items-center gap-2"
        >
          <Upload size={16} />
          Import Private Key
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportKey}
          accept=".txt"
          className="hidden"
        />
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p className="mb-2">
          <strong>Important:</strong> Your private key is the only way to decrypt your messages. 
          Store it safely and never share it with anyone.
        </p>
        <p>
          If you lose your private key, you'll lose access to all encrypted messages.
          Consider exporting your key as a backup.
        </p>
      </div>
    </div>
  );
};

export default E2EEKeyManagement;
