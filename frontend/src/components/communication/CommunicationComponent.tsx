import React from 'react';
import { MessagesView } from './MessagesView';
import { DiscussionsView } from './DiscussionsView';
import { CommHistoryView } from './CommHistoryView';
import { FileSharingView } from './FileSharingView';
import { ActivityLogsView } from './ActivityLogsView';

interface CommunicationComponentProps {
  activeTab: string;
  roleColor: string;
  currentRole: string;
  userName: string;
  onNavigateTab: (tab: string) => void;
}

export const CommunicationComponent: React.FC<CommunicationComponentProps> = ({
  activeTab,
  roleColor,
  currentRole,
  userName,
  onNavigateTab,
}) => {
  switch (activeTab) {
    case 'comm-messages':
      return <MessagesView roleColor={roleColor} currentRole={currentRole} userName={userName} onNavigateTab={onNavigateTab} />;
    case 'comm-discussions':
      return <DiscussionsView roleColor={roleColor} currentRole={currentRole} userName={userName} onNavigateTab={onNavigateTab} />;
    case 'comm-history':
      return <CommHistoryView roleColor={roleColor} currentRole={currentRole} userName={userName} onNavigateTab={onNavigateTab} />;
    case 'comm-files':
      return <FileSharingView roleColor={roleColor} currentRole={currentRole} userName={userName} onNavigateTab={onNavigateTab} />;
    case 'comm-activity':
      return <ActivityLogsView roleColor={roleColor} currentRole={currentRole} onNavigateTab={onNavigateTab} />;
    default:
      return <MessagesView roleColor={roleColor} currentRole={currentRole} userName={userName} onNavigateTab={onNavigateTab} />;
  }
};
