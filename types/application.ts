export interface Application {
  id: string;
  propertyId?: string;
  applicantId: string;
  status: string;
  income?: number;
  householdSize?: number;
  notes?: string;
}
