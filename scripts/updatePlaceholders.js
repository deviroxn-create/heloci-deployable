const fs = require('fs');
const path = require('path');
const mapping = {
  'app/admin/dashboard/page.tsx': {
    title: 'Admin dashboard',
    description: 'Monitor platform health, approve requests, and manage staff and property data from a central admin console.',
    highlights: ['Audit user activity', 'Review applications', 'Manage system settings'],
    actions: [
      { label: 'View users', href: '/admin/users' },
      { label: 'Open application queue', href: '/admin/applications', primary: true }
    ]
  },
  'app/admin/users/page.tsx': {
    title: 'User management',
    description: 'Create, update, and oversee applicant, staff, and admin accounts in one place.',
    highlights: ['Search user accounts', 'Assign roles', 'Revoke access'],
    actions: [
      { label: 'View staff roster', href: '/admin/staff' },
      { label: 'Manage permissions', href: '/admin/settings' }
    ]
  },
  'app/admin/staff/page.tsx': {
    title: 'Staff management',
    description: 'Assign case work, manage communication, and track staff workloads.',
    highlights: ['View staff status', 'Assign applications', 'Track team performance'],
    actions: [
      { label: 'Open applications', href: '/admin/applications' },
      { label: 'Review reports', href: '/admin/reports' }
    ]
  },
  'app/admin/settings/page.tsx': {
    title: 'Admin settings',
    description: 'Configure system preferences, notification rules, and role-based access for your organization.',
    highlights: ['Role definitions', 'Notification settings', 'Compliance options'],
    actions: [
      { label: 'Automation rules', href: '/admin/automation' },
      { label: 'Audit logs', href: '/admin/analytics' }
    ]
  },
  'app/admin/properties/page.tsx': {
    title: 'Property management',
    description: 'Manage listings, update availability, and publish community housing options with ease.',
    highlights: ['Edit property details', 'Update availability', 'Highlight featured units'],
    actions: [
      { label: 'Add new property', href: '/admin/properties', primary: true },
      { label: 'View application list', href: '/admin/applications' }
    ]
  },
  'app/admin/automation/page.tsx': {
    title: 'Automation rules',
    description: 'Create workflow automations to route applications, send notifications, and simplify staff handoffs.',
    highlights: ['Auto assign applications', 'Notification triggers', 'Periodic reporting'],
    actions: [
      { label: 'Review analytics', href: '/admin/analytics' },
      { label: 'Manage settings', href: '/admin/settings' }
    ]
  },
  'app/admin/applications/page.tsx': {
    title: 'Application queue',
    description: 'Review incoming housing applications, update status, and coordinate follow-up steps.',
    highlights: ['Pending requests', 'Under review cases', 'Decision history'],
    actions: [
      { label: 'View applicants', href: '/admin/users' },
      { label: 'Check analytics', href: '/admin/analytics' }
    ]
  },
  'app/admin/analytics/page.tsx': {
    title: 'Analytics',
    description: 'Track program metrics, review outcomes, and visualize performance across applicant cohorts.',
    highlights: ['Application volume', 'Approval rates', 'Program impact'],
    actions: [
      { label: 'Open dashboard', href: '/admin/dashboard' },
      { label: 'Export reports', href: '/admin/reports' }
    ]
  },
  'app/staff/dashboard/page.tsx': {
    title: 'Staff dashboard',
    description: 'A staff workspace to see assigned applications, recent messages, and upcoming tasks.',
    highlights: ['Assigned cases', 'Active conversations', 'Daily priorities'],
    actions: [
      { label: 'View applications', href: '/staff/applications', primary: true },
      { label: 'Open messages', href: '/staff/messages' }
    ]
  },
  'app/staff/applications/page.tsx': {
    title: 'Staff applications',
    description: 'Manage your assigned housing applications and move cases from review toward resolution.',
    highlights: ['Case details', 'Applicant history', 'Review notes'],
    actions: [
      { label: 'Review messages', href: '/staff/messages' },
      { label: 'Check reports', href: '/staff/reports' }
    ]
  },
  'app/staff/messages/page.tsx': {
    title: 'Staff inbox',
    description: 'Communicate with applicants and colleagues, and keep every case discussion in one place.',
    highlights: ['Unread messages', 'Applicant conversations', 'Internal notes'],
    actions: [
      { label: 'Review cases', href: '/staff/applications' },
      { label: 'Open dashboard', href: '/staff/dashboard' }
    ]
  },
  'app/staff/reports/page.tsx': {
    title: 'Staff reports',
    description: 'View the team’s operational trends, process bottlenecks, and productivity signals.',
    highlights: ['Time-to-decision', 'Application throughput', 'Case balances'],
    actions: [
      { label: 'Open analytics', href: '/admin/analytics' },
      { label: 'View dashboard', href: '/staff/dashboard' }
    ]
  },
  'app/staff/reviews/page.tsx': {
    title: 'Staff reviews',
    description: 'Capture application reviews and staff recommendations for every applicant case.',
    highlights: ['Review history', 'Approval notes', 'Follow-up tasks'],
    actions: [
      { label: 'View applications', href: '/staff/applications' },
      { label: 'Open messages', href: '/staff/messages' }
    ]
  },
  'app/applicant/dashboard/page.tsx': {
    title: 'Applicant dashboard',
    description: 'Track your application progress, upload documents, and get support from the housing team.',
    highlights: ['Application status', 'Document uploads', 'Support messages'],
    actions: [
      { label: 'View applications', href: '/applicant/applications', primary: true },
      { label: 'Upload documents', href: '/applicant/documents' }
    ]
  },
  'app/applicant/applications/page.tsx': {
    title: 'My applications',
    description: 'Track the status of your housing applications and stay informed about next steps.',
    highlights: ['Pending applications', 'Document requests', 'Review updates'],
    actions: [
      { label: 'View dashboard', href: '/applicant/dashboard' },
      { label: 'Upload documents', href: '/applicant/documents' }
    ]
  },
  'app/applicant/documents/page.tsx': {
    title: 'Documents',
    description: 'Upload and manage the documents needed to support your housing application.',
    highlights: ['Required files', 'Upload status', 'Document history'],
    actions: [
      { label: 'View applications', href: '/applicant/applications' },
      { label: 'Contact staff', href: '/applicant/messages' }
    ]
  },
  'app/applicant/messages/page.tsx': {
    title: 'Messages',
    description: 'Stay connected with staff and get updates about your application in one inbox.',
    highlights: ['Unread messages', 'Staff replies', 'Application context'],
    actions: [
      { label: 'View dashboard', href: '/applicant/dashboard' },
      { label: 'Upload documents', href: '/applicant/documents' }
    ]
  },
  'app/applicant/settings/page.tsx': {
    title: 'Settings',
    description: 'Update your profile, contact details, and notification preferences.',
    highlights: ['Account info', 'Notification settings', 'Privacy controls'],
    actions: [
      { label: 'View dashboard', href: '/applicant/dashboard' },
      { label: 'View applications', href: '/applicant/applications' }
    ]
  },
  'app/(marketing)/properties/page.tsx': {
    title: 'Available properties',
    description: 'Browse supportive housing options available through Heloci’s community network.',
    highlights: ['Search available units', 'See eligibility details', 'Contact support'],
    actions: [
      { label: 'Learn eligibility', href: '/(marketing)/eligibility', primary: true },
      { label: 'Contact us', href: '/(marketing)/contact' }
    ]
  },
  'app/(marketing)/eligibility/page.tsx': {
    title: 'Eligibility',
    description: 'Learn how Heloci evaluates housing eligibility and what information you need to apply.',
    highlights: ['Eligibility criteria', 'Required documents', 'Application process'],
    actions: [
      { label: 'View properties', href: '/(marketing)/properties' },
      { label: 'Contact support', href: '/(marketing)/contact' }
    ]
  },
  'app/(marketing)/contact/page.tsx': {
    title: 'Contact Heloci',
    description: 'Get in touch if you have questions about eligibility, properties, or the support process.',
    highlights: ['Ask about availability', 'Request guidance', 'Submit general inquiries'],
    actions: [
      { label: 'View properties', href: '/(marketing)/properties' },
      { label: 'Sign in', href: '/login', primary: true }
    ]
  },
  'app/(marketing)/about/page.tsx': {
    title: 'About Heloci',
    description: 'Learn more about Heloci’s mission to connect applicants with supportive housing services.',
    highlights: ['Our mission', 'Community impact', 'How we help'],
    actions: [
      { label: 'Browse properties', href: '/(marketing)/properties' },
      { label: 'Get started', href: '/login' }
    ]
  }
};

for (const [relativePath, data] of Object.entries(mapping)) {
  const filePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) {
    console.error('Missing file:', relativePath);
    continue;
  }
  const content = `import { PlaceholderPage } from "@/components/shared/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      title={${JSON.stringify(data.title)}}
      description={${JSON.stringify(data.description)}}
      highlights={${JSON.stringify(data.highlights)}}
      actions={${JSON.stringify(data.actions)}}
    />
  );
}
`;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', relativePath);
}
