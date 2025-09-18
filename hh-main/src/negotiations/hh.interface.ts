export interface Negotiation {
    action_type: string
    id: string
    payload: {
        employer_id: string
        negotiation_date: string | null
        resume_id: string
        topic_id: string
        vacancy_id: string
    }
    subscription_id: string
    user_id: string
}

export interface TokenStore {
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export interface TokenResponseData {
    access_token: string
    refresh_token: string
    expires_in: number
}

export interface NegotiationJobData {
    negotiation: {
        id: string
        user_id: string
        payload: {
            vacancy_id: string
            resume_id: string
        }
    }
}
