import React, { useState } from 'react';
import { FileText, Plus, ExternalLink, Trash2, Upload, Link as LinkIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Documents = () => {
  const { documents, addDocument, deleteDocument } = useAppContext();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [newDoc, setNewDoc] = useState({ title: '', url: '', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!newDoc.title) {
      setError('Title is required');
      return;
    }

    if (uploadType === 'link' && !newDoc.url) {
      setError('URL is required');
      return;
    }

    if (uploadType === 'file' && !file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = newDoc.url;
      
      if (uploadType === 'file' && file) {
        finalUrl = await api.uploadFile(file, 'documents');
      }

      await addDocument({ 
        title: newDoc.title, 
        url: finalUrl, 
        description: newDoc.description,
        addedBy: user?.name || 'Unknown' 
      });
      
      setIsAdding(false);
      setNewDoc({ title: '', url: '', description: '' });
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileExtension = (url: string) => {
    try {
      // Basic check for common extensions in URL
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('.pdf')) return 'PDF';
      if (lowerUrl.includes('.doc') || lowerUrl.includes('.docx')) return 'DOC';
      if (lowerUrl.includes('.xls') || lowerUrl.includes('.xlsx')) return 'XLS';
      if (lowerUrl.includes('.png') || lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'IMG';
      return 'LINK';
    } catch {
      return 'LINK';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Documents</h2>
          <p className="text-slate-500">Company policies, guidelines, and resources.</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'HR') && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-600/20"
          >
            <Plus size={20} />
            Add Document
          </button>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Add Document</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUploadType('file')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${uploadType === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Upload size={16} /> File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('link')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${uploadType === 'link' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LinkIcon size={16} /> External Link
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={newDoc.title}
                  onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  placeholder="e.g., Employee Handbook"
                />
              </div>

              {uploadType === 'link' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">URL</label>
                  <input
                    type="url"
                    required
                    value={newDoc.url}
                    onChange={e => setNewDoc({...newDoc, url: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    placeholder="https://"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">File</label>
                  <input
                    type="file"
                    required
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea
                  value={newDoc.description}
                  onChange={e => setNewDoc({...newDoc, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  rows={3}
                  placeholder="Brief description of the document..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors shadow-sm shadow-violet-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Save Document'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map(doc => {
          const type = getFileExtension(doc.url);
          
          return (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-violet-200 relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <FileText size={24} />
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
                  {type}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                {doc.title}
                <ExternalLink size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              
              {doc.description && (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{doc.description}</p>
              )}
              
              <div className="text-xs text-slate-400 font-medium">Added by {doc.addedBy}</div>
              
              {(user?.role === 'Admin' || user?.role === 'HR') && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this document?')) {
                      deleteDocument(doc.id);
                    }
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </a>
          );
        })}
        {documents.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-100 border-dashed">
            No documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
};
