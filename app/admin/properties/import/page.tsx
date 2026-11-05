'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PropertyImportResponse } from '@/lib/properties/property-import.service';
import { PropertyImportResults } from '@/components/property/property-import-results';

export default function PropertyImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PropertyImportResponse | null>(null);
  const [dryRun, setDryRun] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json')) {
        setError('Please select a JSON file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dryRun', String(dryRun));

      const response = await fetch('/api/admin/properties/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data: PropertyImportResponse = await response.json();
      setResult(data);
      if (!dryRun) {
        setFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">
            Import Properties
          </h1>
          <p className="text-slate-600 mb-8">
            Upload a JSON file containing property data to import into your system
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select JSON File
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-slate-400 transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="block w-full text-slate-500"
                />
                {file && (
                  <p className="mt-3 text-sm font-medium text-green-600">
                    ✓ {file.name}
                  </p>
                )}
              </div>
            </div>

            {/* Dry Run Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="dryRun" className="ml-3 text-sm font-medium text-slate-700">
                Dry run (preview only, don&apos;t save)
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                !file || loading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Uploading...' : `${dryRun ? 'Preview' : 'Import'} Properties`}
            </button>
          </form>

          {/* Results */}
          {result && (
            <div className="mt-8 space-y-6">
              <PropertyImportResults response={result} />

              {!dryRun && (
                <button
                  onClick={() => router.push('/admin/properties')}
                  className="w-full py-2 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                >
                  View Properties
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
