import { MeetingSessionHeader } from "./MeetingSessionHeader";

export type RoomPreJoinLobbyHeaderProps = {
  meetingTitle: string;
  meetingDescription: string;
};

export function RoomPreJoinLobbyHeader({
  meetingTitle,
  meetingDescription,
}: RoomPreJoinLobbyHeaderProps) {
  return (
    <MeetingSessionHeader
      meetingTitle={meetingTitle}
      meetingDescription={meetingDescription}
    />
  );
}
