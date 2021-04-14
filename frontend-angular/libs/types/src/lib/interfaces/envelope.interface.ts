export interface Envelope {
  container: string;
  container_path?: string;
  imported: boolean;
  metadata_file_content: any;
  path: string;
  pk: string;
}
