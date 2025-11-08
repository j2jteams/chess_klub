import { Organization } from '@/lib/models';
import { collections } from '../collections';
import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  queryDocuments,
  deleteDocument 
} from '../db';
import { where } from 'firebase/firestore';

/**
 * Repository for organization-related database operations
 */
export const OrganizationRepository = {
  /**
   * Create a new organization
   */
  createOrganization: async (data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createDocument<Organization>(collections.ORGANIZATIONS, data);
  },
  
  /**
   * Get an organization by ID
   */
  getOrganizationById: async (id: string) => {
    return getDocument<Organization>(collections.ORGANIZATIONS, id);
  },
  
  /**
   * Update an organization
   */
  updateOrganization: async (
    id: string, 
    data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    return updateDocument<Organization>(collections.ORGANIZATIONS, id, data);
  },
  
  /**
   * Delete an organization
   */
  deleteOrganization: async (id: string) => {
    return deleteDocument(collections.ORGANIZATIONS, id);
  },
  
  /**
   * Get all organizations
   */
  getAllOrganizations: async () => {
    const { documents } = await queryDocuments<Organization>(
      collections.ORGANIZATIONS,
      [],
      { orderByField: 'name', orderDirection: 'asc' }
    );
    
    return documents;
  },
  
  /**
   * Get organizations by admin user ID
   */
  getOrganizationsByAdminId: async (userId: string) => {
    const { documents } = await queryDocuments<Organization>(
      collections.ORGANIZATIONS,
      [where('adminIds', 'array-contains', userId)]
    );
    
    return documents;
  }
};