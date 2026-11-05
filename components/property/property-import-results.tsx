import type { PropertyImportResponse } from '@/lib/properties/property-import.service';

interface PropertyImportResultsProps {
  response: PropertyImportResponse;
}

export function PropertyImportResults({ response }: PropertyImportResultsProps) {
  const succeeded = response.summary.created + response.summary.updated;
  const warningCount = response.results.reduce((count, result) => count + result.warnings.length, 0);
  const errorCount = response.errors.length + response.results.reduce((count, result) => count + result.errors.length, 0);
  const summaryItems = [
    { label: 'Received', value: response.summary.received, color: 'text-slate-700' },
    { label: 'Succeeded', value: succeeded, color: 'text-green-600' },
    { label: 'Created', value: response.summary.created, color: 'text-green-600' },
    { label: 'Updated', value: response.summary.updated, color: 'text-blue-600' },
    { label: 'Skipped', value: response.summary.skipped, color: 'text-yellow-700' },
    { label: 'Failed', value: response.summary.failed, color: 'text-red-600' },
    { label: 'Warnings', value: warningCount, color: 'text-yellow-700' },
    { label: 'Errors', value: errorCount, color: 'text-orange-700' }
  ];

  return (
    <div className="border-t pt-8">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Import Summary</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-600">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {response.errors.length > 0 && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 p-3">
          <h3 className="font-semibold text-red-800">Import Errors</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
            {response.errors.map((message, index) => <li key={`${index}-${message}`}>{message}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-3 font-semibold text-slate-900">Import Results</h3>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {response.results.map((result, index) => (
            <div key={`${result.externalId}-${index}`} className="rounded border border-slate-200 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{result.title || result.externalId}</p>
                <span className="text-xs font-semibold uppercase text-slate-600">{result.status}</span>
              </div>
              {result.title && <p className="mt-1 text-xs text-slate-500">{result.externalId}</p>}
              {result.propertyId && <p className="mt-1 text-xs text-slate-500">Property ID: {result.propertyId}</p>}
              {result.changes && result.changes.length > 0 && (
                <p className="mt-2 text-sm text-slate-700">Updated: {result.changes.join(', ')}</p>
              )}
              {result.warnings.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-yellow-800">
                  {result.warnings.map((message, messageIndex) => <li key={`${messageIndex}-${message}`}>{message}</li>)}
                </ul>
              )}
              {result.errors.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
                  {result.errors.map((message, messageIndex) => <li key={`${messageIndex}-${message}`}>{message}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}