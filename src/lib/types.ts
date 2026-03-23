export interface Clip {
  readonly id: string;
  readonly user_id: string;
  readonly content: string;
  readonly device_name: string;
  readonly pinned: boolean;
  readonly created_at: string;
}

export interface NewClip {
  readonly content: string;
  readonly device_name: string;
  readonly pinned?: boolean;
}
