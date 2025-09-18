export interface Application {
    applicant: {
        data: object
        id: string
        resume_id: string
    }
    contacts: {
        chat: { value: string } | null
        phones: {
            status: string | null
            value: string
        }[]
    }
    created_at: string
    id: string
    negotiation_id: number
    updated_at: string
    vacancy_id: number
}

/**
 * Resume for response
 */
export interface Resume {
    id: number
    description: string
    start_time: string
    update_time: string
    title: string
    is_purchased: boolean
    data?: {
        phone: string
        email: string
        full_name: {
            first_name: string
            last_name: string
            patronymic: string | null
        } | null
        name: string
    }
}

export interface Contacts {
    contacts: {
        type: 'phone' | 'e-mail' | 'chat_id'
        value: string
    }[]
    full_name: {
        first_name: string
        last_name: string
        patronymic: string | null
    } | null
    name: string
}

export class Account {
    clientId: string
    clientSecret: string
    accessToken: string = ''
    expiresIn: number = 0
}
