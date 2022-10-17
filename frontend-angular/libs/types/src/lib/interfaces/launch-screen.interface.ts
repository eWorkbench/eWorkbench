export interface LaunchScreen {
  pk: string;
  title: string;
  text: string;
  show_screen: boolean;
  version: string;
  last_modified_at: string;
}

export interface AcceptedScreen {
  launch_screen: string;
  accepted_version: string;
  accepted_timestamp: string;
}

export interface AcceptedScreenPayload {
  launch_screen: string;
  accepted_version: string;
  accepted_timestamp: string;
}
