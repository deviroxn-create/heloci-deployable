-- FIX SUPER ADMIN IN PRISMA DATABASE
-- This SQL directly fixes the Super Admin record

-- Update the Super Admin to have correct role and no organization
UPDATE "User" 
SET 
  role = 'SUPER_ADMIN',
  "organizationId" = NULL,
  "departmentId" = NULL,
  "teamId" = NULL,
  "jobTitle" = NULL,
  "employeeId" = NULL,
  name = 'Platform Super Admin'
WHERE email = 'superadmin@heloci.platform';

-- Verify the update
SELECT 
  id,
  email,
  name,
  role,
  "organizationId",
  "departmentId",
  "teamId"
FROM "User"
WHERE email = 'superadmin@heloci.platform';
