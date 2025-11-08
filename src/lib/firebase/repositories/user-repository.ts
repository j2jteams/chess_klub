import { User, UserRole, CachedLocationData } from '@/lib/models';
import { collections } from '../collections';
import { 
  createDocumentWithId, 
  getDocument, 
  updateDocument, 
  queryDocuments,
  deleteDocument
} from '../db';
import { where } from 'firebase/firestore';

/**
 * Repository for user-related database operations
 */
export const UserRepository = {
  /**
   * Create a new user profile in Firestore
   * New sign-ups have no role initially - owner will promote them to admin
   * Exception: If email matches INITIAL_OWNER_EMAIL, assign OWNER role
   */
  createUser: async (user: Omit<User, 'createdAt' | 'updatedAt' | 'role'>) => {
    // Check if this is the initial owner
    const initialOwnerEmail = process.env.NEXT_PUBLIC_INITIAL_OWNER_EMAIL;
    const isInitialOwner = initialOwnerEmail && user.email === initialOwnerEmail;
    
    // Build user data - only include role if it has a value (Firestore doesn't allow undefined)
    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      ...user,
    };
    
    // Only add role field if user is initial owner (don't include undefined values)
    if (isInitialOwner) {
      userData.role = UserRole.OWNER;
    }
    // If not initial owner, role field is simply omitted (no role = pending approval)
    
    return createDocumentWithId<User>(
      collections.USERS,
      user.uid,
      userData
    );
  },
  
  /**
   * Get a user by their ID
   */
  getUserById: async (uid: string) => {
    return getDocument<User>(collections.USERS, uid);
  },
  
  /**
   * Update a user's profile
   */
  updateUser: async (uid: string, data: Partial<Omit<User, 'id' | 'uid' | 'createdAt' | 'updatedAt'>>) => {
    return updateDocument<User>(collections.USERS, uid, data);
  },
  
  /**
   * Get users by role
   */
  getUsersByRole: async (role: UserRole) => {
    const { documents } = await queryDocuments<User>(
      collections.USERS,
      [where('role', '==', role)]
    );
    
    return documents;
  },
  
  /**
   * Get users by organization
   */
  getUsersByOrganization: async (organizationId: string) => {
    const { documents } = await queryDocuments<User>(
      collections.USERS,
      [where('organizationId', '==', organizationId)]
    );
    
    return documents;
  },
  
  /**
   * Update user preferences
   */
  updateUserPreferences: async (uid: string, preferences: User['preferences']) => {
    return updateDocument<User>(collections.USERS, uid, { preferences });
  },

  /**
   * Update user's cached location data
   */
  updateCachedLocation: async (uid: string, locationData: CachedLocationData) => {
    const user = await getDocument<User>(collections.USERS, uid);
    if (!user) {
      throw new Error('User not found');
    }

    const currentPreferences = user.preferences || {
      notificationMethods: [],
      emailNotifications: true,
      smsNotifications: false,
      whatsappNotifications: false
    };

    const updatedPreferences = {
      ...currentPreferences,
      cachedLocation: locationData
    };

    return updateDocument<User>(collections.USERS, uid, { 
      preferences: updatedPreferences 
    });
  },

  /**
   * Get user's cached location data
   */
  getCachedLocation: async (uid: string): Promise<CachedLocationData | null> => {
    const user = await getDocument<User>(collections.USERS, uid);
    return user?.preferences?.cachedLocation || null;
  },

  /**
   * Promote a user to admin role
   */
  promoteToAdmin: async (userId: string): Promise<void> => {
    return updateDocument<User>(collections.USERS, userId, {
      role: UserRole.ADMIN
    });
  },

  /**
   * Demote an admin (remove admin role)
   */
  demoteFromAdmin: async (userId: string): Promise<void> => {
    return updateDocument<User>(collections.USERS, userId, {
      role: undefined
    });
  },

  /**
   * Get all users with admin role
   */
  getAllAdmins: async (): Promise<User[]> => {
    return UserRepository.getUsersByRole(UserRole.ADMIN);
  },

  /**
   * Get all users with no role (pending admin approval)
   */
  getPendingAdmins: async (): Promise<User[]> => {
    try {
      console.log('Fetching all users to find pending admins...');
      // Get all users and filter those without a role
      // Note: Firestore doesn't support querying for undefined/null fields directly
      // So we'll get all users and filter client-side
      // Removed orderBy to avoid index requirements
      const { documents } = await queryDocuments<User>(
        collections.USERS,
        []
      );
      
      console.log('Total users fetched:', documents.length);
      console.log('All users:', documents.map(u => ({ 
        id: u.id, 
        email: u.email, 
        role: u.role || 'NO ROLE',
        hasRole: !!u.role
      })));
      
      // Filter users with no role (pending approval)
      const pending = documents.filter(user => !user.role);
      console.log('Pending admins found:', pending.length, pending);
      
      // Sort client-side by createdAt if available
      return pending.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
        return bDate - aDate; // newest first
      });
    } catch (error: any) {
      console.error('Error in getPendingAdmins:', error);
      // Log full error details
      if (error?.code) console.error('Firebase error code:', error.code);
      if (error?.message) console.error('Firebase error message:', error.message);
      if (error?.stack) console.error('Error stack:', error.stack);
      // Re-throw with more context
      throw new Error(`Failed to fetch pending admins: ${error?.message || error?.toString() || 'Unknown error'}`);
    }
  },

  /**
   * Get user by email
   */
  getUserByEmail: async (email: string): Promise<User | null> => {
    const { documents } = await queryDocuments<User>(
      collections.USERS,
      [where('email', '==', email)]
    );
    
    return documents.length > 0 ? documents[0] : null;
  },

  /**
   * Delete a user account
   * Note: This will also need to handle Firebase Auth deletion separately
   */
  deleteUser: async (userId: string): Promise<void> => {
    return deleteDocument(collections.USERS, userId);
  }
};