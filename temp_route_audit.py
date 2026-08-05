import os
import re
root = os.getcwd()
route_files = []
for dirpath, dirnames, filenames in os.walk(os.path.join(root, 'app', 'api')):
    for fn in filenames:
        if fn.endswith('.ts'):
            route_files.append(os.path.join(dirpath, fn))

pat_prisma = re.compile(r'from\s+["\']@/lib/prisma/client["\']')
pat_service = re.compile(r'from\s+["\']@/lib/(?!prisma|auth)[^"\']+["\']')
pat_auth = re.compile(r'getCurrentUser\(|resolveCommunicationScope\(|authorize[A-Za-z]*\(|requireOrgRole\(|getServerSession\(|cookies\(|headers\(|role\.|SUPER_ADMIN|platform_admin')
pat_public = re.compile(r'public|health|cron|status|featured|programs|apply|auth/me', re.IGNORECASE)

results = []
for f in sorted(route_files):
    with open(f, 'r', encoding='utf8') as fh:
        txt = fh.read()
    results.append({
        'file': os.path.relpath(f, root).replace('\\', '/'),
        'hasPrisma': bool(pat_prisma.search(txt)),
        'hasServiceImport': bool(pat_service.search(txt)),
        'hasAuthMarker': bool(pat_auth.search(txt)),
        'isPublicPossible': bool(pat_public.search(txt)),
    })

print('TOTAL_ROUTE_FILES=' + str(len(results)))
print('PRISMA_IMPORTS=' + str(sum(r['hasPrisma'] for r in results)))
print('SERVICE_IMPORTS=' + str(sum(r['hasServiceImport'] for r in results)))
print('AUTH_MARKERS=' + str(sum(r['hasAuthMarker'] for r in results)))
print('PRISMA_ONLY_ROUTE_FILES=')
for r in results:
    if r['hasPrisma'] and not r['hasServiceImport']:
        print(r['file'])
print('POTENTIAL_AUTH_MISSING_PUBLIC_ROUTES=')
for r in results:
    if not r['hasAuthMarker'] and not r['isPublicPossible']:
        print(r['file'])
