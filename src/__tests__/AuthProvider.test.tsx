import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider } from '../src/context/authProvider';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}));

describe('AuthProvider Error Handling', () => {
  let mockSupabase: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSupabase = createClient();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should handle PGRST116 error (no rows found) gracefully with warning only', async () => {
    // Mock "no rows found" error
    const mockQuery = mockSupabase.from().select().eq().single();
    mockQuery.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' }
    });

    // Mock successful session
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'test-user-id' } } }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    renderHook(() => {}, { wrapper });

    await waitFor(() => {
      // Should not log error for PGRST116
      expect(consoleSpy).not.toHaveBeenCalled();
      // Should log warning
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No profile found for user test-user-id')
      );
    });
  });

  it('should handle other database errors with proper error logging', async () => {
    // Mock other database error
    const mockQuery = mockSupabase.from().select().eq().single();
    mockQuery.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST301', message: 'Database connection failed' }
    });

    // Mock successful session
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'test-user-id' } } }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    renderHook(() => {}, { wrapper });

    await waitFor(() => {
      // Should log error for non-PGRST116 errors
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching user profile:',
        expect.objectContaining({ code: 'PGRST301' })
      );
    });
  });

  it('should handle empty role data with warning', async () => {
    // Mock successful query with null role
    const mockQuery = mockSupabase.from().select().eq().single();
    mockQuery.mockResolvedValueOnce({
      data: { role: null, first_name: 'John', last_name: 'Doe', submitted_idea: 'false' },
      error: null
    });

    // Mock successful session
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'test-user-id' } } }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    renderHook(() => {}, { wrapper });

    await waitFor(() => {
      // Should log warning for null role
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No role data found for user test-user-id')
      );
    });
  });

  it('should handle successful role fetch without any warnings', async () => {
    // Mock successful query with valid role
    const mockQuery = mockSupabase.from().select().eq().single();
    mockQuery.mockResolvedValueOnce({
      data: { role: 'admin', first_name: 'John', last_name: 'Doe', submitted_idea: 'true' },
      error: null
    });

    // Mock successful session
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'test-user-id' } } }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    renderHook(() => {}, { wrapper });

    await waitFor(() => {
      // Should not log any errors or warnings for successful fetch
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});
