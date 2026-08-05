#!/usr/bin/env node

/**
 * API Certification Scanner
 * 
 * Discovers all API endpoints, tests basic functionality, security, and data integrity.
 * Generates comprehensive report for Phase 8 certification.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class APICertificationScanner {
  constructor() {
    this.findings = {
      endpoints: [],
      security: [],
      dataIntegrity: [],
      performance: [],
      errors: []
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const color = {
      info: colors.cyan,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
      debug: colors.blue
    }[type] || colors.reset;
    
    console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
  }

  async discoverEndpoints() {
    this.log('Scanning for API endpoints...', 'info');
    
    try {
      const apiDir = path.join(process.cwd(), 'app/api');
      const endpoints = [];
      
      // Recursive scan of app/api directory
      const scanDir = (dir, basePath = '') => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory() && !file.startsWith('_')) {
            scanDir(fullPath, path.join(basePath, file));
          } else if (file === 'route.ts' || file === 'route.js') {
            const routePath = `/api${basePath}`;
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Detect HTTP methods
            const methods = [];
            if (content.includes('export async function GET')) methods.push('GET');
            if (content.includes('export async function POST')) methods.push('POST');
            if (content.includes('export async function PATCH')) methods.push('PATCH');
            if (content.includes('export async function PUT')) methods.push('PUT');
            if (content.includes('export async function DELETE')) methods.push('DELETE');
            if (content.includes('export async function OPTIONS')) methods.push('OPTIONS');
            if (content.includes('export async function HEAD')) methods.push('HEAD');
            
            // Detect security patterns
            const hasAuth = content.includes('getCurrentUser');
            const hasRBAC = content.includes('requireOrgRole') || content.includes('hasOrgRole');
            const hasValidation = content.includes('z.parse') || content.includes('validate');
            
            if (methods.length > 0) {
              endpoints.push({
                path: routePath,
                file: fullPath.replace(process.cwd(), ''),
                methods,
                hasAuth,
                hasRBAC,
                hasValidation
              });
            }
          }
        });
      };
      
      scanDir(apiDir);
      
      this.findings.endpoints = endpoints;
      this.log(`Found ${endpoints.length} endpoints`, 'success');
      return endpoints;
    } catch (error) {
      this.log(`Endpoint discovery failed: ${error.message}`, 'error');
      this.findings.errors.push({
        phase: 'discovery',
        error: error.message
      });
      return [];
    }
  }

  analyzeSecurityPatterns() {
    this.log('Analyzing security patterns...', 'info');
    
    const issues = [];
    
    this.findings.endpoints.forEach(endpoint => {
      const content = fs.readFileSync(endpoint.file, 'utf8');
      
      // Check for missing authentication on protected endpoints
      const isPublic = content.includes('// Public') || endpoint.path === '/api' || endpoint.path.startsWith('/api/auth');
      if (!isPublic && !endpoint.hasAuth) {
        issues.push({
          severity: 'HIGH',
          endpoint: endpoint.path,
          method: endpoint.methods[0],
          issue: 'Missing authentication check',
          file: endpoint.file
        });
      }
      
      // Check for SQL injection patterns
      if (content.includes('query(') && !content.includes('$') && !content.includes('prisma')) {
        issues.push({
          severity: 'HIGH',
          endpoint: endpoint.path,
          method: endpoint.methods[0],
          issue: 'Potential SQL injection (raw query detected)',
          file: endpoint.file
        });
      }
      
      // Check for XSS vulnerabilities
      if (content.includes('dangerouslySetInnerHTML') || content.includes('innerHTML')) {
        issues.push({
          severity: 'MEDIUM',
          endpoint: endpoint.path,
          method: endpoint.methods[0],
          issue: 'Direct HTML injection detected',
          file: endpoint.file
        });
      }
      
      // Check for error handling
      if (!content.includes('try') || !content.includes('catch')) {
        issues.push({
          severity: 'MEDIUM',
          endpoint: endpoint.path,
          method: endpoint.methods[0],
          issue: 'Missing error handling',
          file: endpoint.file
        });
      }
      
      // Check for validation
      if (!endpoint.hasValidation && endpoint.methods.includes('POST')) {
        issues.push({
          severity: 'MEDIUM',
          endpoint: endpoint.path,
          method: 'POST',
          issue: 'Missing input validation',
          file: endpoint.file
        });
      }
    });
    
    this.findings.security = issues;
    this.log(`Found ${issues.length} security issues`, issues.length > 0 ? 'warning' : 'success');
    return issues;
  }

  analyzeDataIntegrity() {
    this.log('Analyzing data integrity patterns...', 'info');
    
    const issues = [];
    
    this.findings.endpoints.forEach(endpoint => {
      if (!endpoint.methods.includes('PATCH') && !endpoint.methods.includes('POST') && !endpoint.methods.includes('DELETE')) {
        return; // Skip read-only endpoints
      }
      
      const content = fs.readFileSync(endpoint.file, 'utf8');
      
      // Check for audit logging on write operations
      if ((endpoint.methods.includes('PATCH') || endpoint.methods.includes('POST') || endpoint.methods.includes('DELETE')) 
          && !content.includes('AuditLog') && !content.includes('auditLog')) {
        issues.push({
          severity: 'HIGH',
          endpoint: endpoint.path,
          method: endpoint.methods.filter(m => ['POST', 'PATCH', 'DELETE'].includes(m))[0],
          issue: 'Missing AuditLog creation',
          file: endpoint.file
        });
      }
      
      // Check for transaction support
      if ((endpoint.methods.includes('PATCH') || endpoint.methods.includes('POST') || endpoint.methods.includes('DELETE'))
          && content.includes('prisma.') && !content.includes('$transaction') && content.includes('await')) {
        // May not be critical if single operation, but worth noting
        issues.push({
          severity: 'LOW',
          endpoint: endpoint.path,
          method: endpoint.methods.filter(m => ['POST', 'PATCH', 'DELETE'].includes(m))[0],
          issue: 'No explicit transaction wrapping (verify if needed)',
          file: endpoint.file
        });
      }
      
      // Check for timestamp updates
      if (endpoint.methods.includes('PATCH') && !content.includes('updatedAt')) {
        issues.push({
          severity: 'MEDIUM',
          endpoint: endpoint.path,
          method: 'PATCH',
          issue: 'Missing updatedAt timestamp update',
          file: endpoint.file
        });
      }
    });
    
    this.findings.dataIntegrity = issues;
    this.log(`Found ${issues.length} data integrity issues`, issues.length > 0 ? 'warning' : 'success');
    return issues;
  }

  generateEndpointMatrix() {
    this.log('Generating endpoint matrix...', 'info');
    
    const matrix = [];
    matrix.push('# API Endpoint Matrix - Phase 8 Verification\n');
    matrix.push(`Generated: ${new Date().toISOString()}\n`);
    matrix.push('| Category | Path | Methods | Auth | RBAC | Validation | Audit | Status |\n');
    matrix.push('|----------|------|---------|------|------|------------|-------|--------|\n');
    
    // Group endpoints by category
    const categories = {};
    this.findings.endpoints.forEach(ep => {
      const category = ep.path.split('/')[2] || 'root';
      if (!categories[category]) categories[category] = [];
      categories[category].push(ep);
    });
    
    Object.keys(categories).sort().forEach(category => {
      categories[category].forEach(ep => {
        const methods = ep.methods.join(', ');
        const auth = ep.hasAuth ? '✓' : '✗';
        const rbac = ep.hasRBAC ? '✓' : '✗';
        const validation = ep.hasValidation ? '✓' : '✗';
        
        // Check for audit logging in POST/PATCH/DELETE
        const content = fs.readFileSync(ep.file, 'utf8');
        const hasAudit = content.includes('AuditLog') || !ep.methods.some(m => ['POST', 'PATCH', 'DELETE'].includes(m));
        const audit = hasAudit ? '✓' : '✗';
        
        matrix.push(`| ${category} | ${ep.path} | ${methods} | ${auth} | ${rbac} | ${validation} | ${audit} | PENDING |\n`);
      });
    });
    
    fs.writeFileSync(path.join(process.cwd(), 'API_ENDPOINT_MATRIX_DRAFT.md'), matrix.join(''));
    this.log('Endpoint matrix generated: API_ENDPOINT_MATRIX_DRAFT.md', 'success');
  }

  generateSecurityReport() {
    this.log('Generating security report...', 'info');
    
    const report = [];
    report.push('# API Security Report - Phase 8\n');
    report.push(`Generated: ${new Date().toISOString()}\n`);
    report.push(`Total Endpoints: ${this.findings.endpoints.length}\n`);
    report.push(`Security Issues Found: ${this.findings.security.length}\n\n`);
    
    // Group by severity
    const bySeverity = {
      HIGH: this.findings.security.filter(i => i.severity === 'HIGH'),
      MEDIUM: this.findings.security.filter(i => i.severity === 'MEDIUM'),
      LOW: this.findings.security.filter(i => i.severity === 'LOW')
    };
    
    report.push('## Critical Issues (HIGH)\n');
    bySeverity.HIGH.forEach(issue => {
      report.push(`- **${issue.endpoint}** (${issue.method}): ${issue.issue}\n`);
      report.push(`  Location: ${issue.file}\n\n`);
    });
    
    report.push('## Medium Priority Issues\n');
    bySeverity.MEDIUM.forEach(issue => {
      report.push(`- **${issue.endpoint}** (${issue.method}): ${issue.issue}\n`);
      report.push(`  Location: ${issue.file}\n\n`);
    });
    
    report.push('## Low Priority Issues\n');
    bySeverity.LOW.forEach(issue => {
      report.push(`- **${issue.endpoint}** (${issue.method}): ${issue.issue}\n`);
      report.push(`  Location: ${issue.file}\n\n`);
    });
    
    fs.writeFileSync(path.join(process.cwd(), 'API_SECURITY_REPORT_DRAFT.md'), report.join(''));
    this.log('Security report generated: API_SECURITY_REPORT_DRAFT.md', 'success');
  }

  generateDataIntegrityReport() {
    this.log('Generating data integrity report...', 'info');
    
    const report = [];
    report.push('# API Data Integrity Report - Phase 8\n');
    report.push(`Generated: ${new Date().toISOString()}\n`);
    report.push(`Data Integrity Issues Found: ${this.findings.dataIntegrity.length}\n\n`);
    
    // Group by severity
    const bySeverity = {
      HIGH: this.findings.dataIntegrity.filter(i => i.severity === 'HIGH'),
      MEDIUM: this.findings.dataIntegrity.filter(i => i.severity === 'MEDIUM'),
      LOW: this.findings.dataIntegrity.filter(i => i.severity === 'LOW')
    };
    
    report.push('## Critical Issues (Missing Audit Logs)\n');
    bySeverity.HIGH.forEach(issue => {
      report.push(`- **${issue.endpoint}** (${issue.method}): ${issue.issue}\n`);
      report.push(`  Location: ${issue.file}\n\n`);
    });
    
    report.push('## Medium Priority Issues\n');
    bySeverity.MEDIUM.forEach(issue => {
      report.push(`- **${issue.endpoint}** (${issue.method}): ${issue.issue}\n`);
      report.push(`  Location: ${issue.file}\n\n`);
    });
    
    report.push('## Low Priority Issues\n');
    bySeverity.LOW.forEach(issue => {
      report.push(`- **${issue.endpoint}** (${issue.method}): ${issue.issue}\n`);
      report.push(`  Location: ${issue.file}\n\n`);
    });
    
    fs.writeFileSync(path.join(process.cwd(), 'API_DATA_INTEGRITY_REPORT_DRAFT.md'), report.join(''));
    this.log('Data integrity report generated: API_DATA_INTEGRITY_REPORT_DRAFT.md', 'success');
  }

  async run() {
    console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}  RC2 Phase 8: API Certification Scanner${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);
    
    try {
      // Phase 1: Discover endpoints
      await this.discoverEndpoints();
      
      // Phase 2: Security analysis
      this.analyzeSecurityPatterns();
      
      // Phase 3: Data integrity analysis
      this.analyzeDataIntegrity();
      
      // Phase 4: Generate reports
      this.generateEndpointMatrix();
      this.generateSecurityReport();
      this.generateDataIntegrityReport();
      
      // Summary
      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
      console.log(`\n${colors.green}✓ Certification scan complete (${duration}s)${colors.reset}`);
      console.log(`\n${colors.cyan}Summary:${colors.reset}`);
      console.log(`  Endpoints found: ${this.findings.endpoints.length}`);
      console.log(`  Security issues: ${this.findings.security.length}`);
      console.log(`  Data integrity issues: ${this.findings.dataIntegrity.length}`);
      console.log(`  Errors: ${this.findings.errors.length}`);
      
      console.log(`\n${colors.cyan}Generated Reports:${colors.reset}`);
      console.log('  - API_ENDPOINT_MATRIX_DRAFT.md');
      console.log('  - API_SECURITY_REPORT_DRAFT.md');
      console.log('  - API_DATA_INTEGRITY_REPORT_DRAFT.md');
      
    } catch (error) {
      this.log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run scanner
const scanner = new APICertificationScanner();
scanner.run().catch(error => {
  console.error(`${colors.red}[FATAL]${colors.reset}`, error);
  process.exit(1);
});
