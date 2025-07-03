export interface Repository {
  /**
   * Cleanup all active subscriptions and resources.
   * This should be called when the LocalDataSource instance is no longer needed
   * to prevent memory leaks and ensure proper cleanup of PouchDB change feeds.
   */
  cleanup: () => Promise<void>;
}
