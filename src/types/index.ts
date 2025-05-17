export interface Poll {
    id: number;
    question: string;
    options: string[];
    created_at: Date;
    expires_at: Date;
    is_closed: boolean;
}

export interface Vote {
    id: number;
    poll_id: number;
    user_id: string;
    option_index: number;
    created_at: Date;
}

export interface PollResult {
    poll: Poll;
    votes: Record<number, number>;
    total_votes: number;
}

export interface CreatePollRequest {
    question: string;
    options: string[];
    expires_at: string;
}

export interface VoteRequest {
    option_index: number;
}

export interface WebSocketMessage {
    type: 'vote' | 'poll_closed';
    poll_id: number;
    data: any;
}

export interface JWTPayload {
    user_id: string;
    iat: number;
    exp: number;
} 