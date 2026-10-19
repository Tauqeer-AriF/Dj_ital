import React from 'react';
import { BackupRestoreManager } from './BackupRestoreManager';

export const StorageManager: React.FC<{ onRefresh: () => void }> = (props) => {
  return <BackupRestoreManager {...props} />;
};

export default StorageManager;
