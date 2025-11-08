import { Submission, SubmissionStatus } from '@/lib/models';
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
 * Repository for submission-related database operations
 */
export const SubmissionRepository = {
  /**
   * Create a new submission
   */
  createSubmission: async (data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createDocument<Submission>(collections.SUBMISSIONS, data);
  },
  
  /**
   * Get a submission by ID
   */
  getSubmissionById: async (id: string) => {
    return getDocument<Submission>(collections.SUBMISSIONS, id);
  },
  
  /**
   * Update a submission
   */
  updateSubmission: async (
    id: string, 
    data: Partial<Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    return updateDocument<Submission>(collections.SUBMISSIONS, id, data);
  },
  
  /**
   * Delete a submission
   */
  deleteSubmission: async (id: string) => {
    return deleteDocument(collections.SUBMISSIONS, id);
  },
  
  /**
   * Get submissions by status
   */
  getSubmissionsByStatus: async (status: SubmissionStatus) => {
    const { documents } = await queryDocuments<Submission>(
      collections.SUBMISSIONS,
      [where('status', '==', status)],
      { orderByField: 'createdAt', orderDirection: 'desc' }
    );
    
    return documents;
  },
  
  /**
   * Get submissions by submitter ID
   */
  getSubmissionsBySubmitterId: async (submitterId: string) => {
    const { documents } = await queryDocuments<Submission>(
      collections.SUBMISSIONS,
      [where('submitterId', '==', submitterId)],
      { orderByField: 'createdAt', orderDirection: 'desc' }
    );
    
    return documents;
  },
  
  /**
   * Update submission status
   */
  updateSubmissionStatus: async (id: string, status: SubmissionStatus) => {
    return updateDocument<Submission>(collections.SUBMISSIONS, id, { status });
  },
  
  /**
   * Link a submission to a created event
   */
  linkSubmissionToEvent: async (submissionId: string, eventId: string) => {
    return updateDocument<Submission>(collections.SUBMISSIONS, submissionId, { 
      eventId,
      status: SubmissionStatus.APPROVED
    });
  },
  
  /**
   * Get pending submissions requiring review
   */
  getPendingReviewSubmissions: async () => {
    const { documents } = await queryDocuments<Submission>(
      collections.SUBMISSIONS,
      [where('status', '==', SubmissionStatus.PENDING_REVIEW)],
      { orderByField: 'createdAt', orderDirection: 'asc' }
    );
    
    return documents;
  }
};