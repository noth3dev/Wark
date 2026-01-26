export interface Tag {
    id: string;
    name: string;
    color?: string;
    icon?: string;
}

export interface ActiveSession {
    id: string;
    tag_id: string;
    start_time: string;
}

export interface Session {
    id: string;
    tag_id: string;
    duration: number;
    created_at: string;
}
