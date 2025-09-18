import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance, Method } from 'axios'
import { ConfigService } from '@nestjs/config'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { TokenResponseData } from './hh.interface'

@Injectable()
export class HhApiService {
    private readonly logger = new Logger(HhApiService.name)
    private readonly axiosInstance: AxiosInstance
    private readonly tokenFilePath = './temp/token.json'
    private tokenStore: { accessToken: string; refreshToken: string; expiresIn: number }

    constructor(private readonly configService: ConfigService) {
        this.axiosInstance = axios.create({
            baseURL: this.configService.get('HH_API_URL', 'https://api.hh.ru'),
            headers: {
                'HH-User-Agent': this.configService.get('HH_USER_AGENT', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'),
            },
        })

        this.readToken()

        // Check token expiration on startup
        if (this.tokenStore.expiresIn < Date.now()) {
            this.refreshToken().catch(() => {
                this.logger.error('There is no refresh token. Please, log in')
            })
        }

        // Add response interceptor for handling 403 errors
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 403 && !error.config._retry) {
                    error.config._retry = true
                    await this.refreshToken()
                    return this.axiosInstance(error.config)
                }
                throw error
            },
        )
    }

    private readToken() {
        this.logger.debug('Reading token from file')
        if (!existsSync(this.tokenFilePath)) {
            this.logger.warn('Token file does not exist, creating new token store')
            this.tokenStore = {
                accessToken: '',
                refreshToken: '',
                expiresIn: 0,
            }
            writeFileSync(this.tokenFilePath, JSON.stringify(this.tokenStore))
        } else {
            this.tokenStore = JSON.parse(readFileSync(this.tokenFilePath, 'utf-8'))
        }

        if (this.tokenStore.accessToken) {
            this.axiosInstance.defaults.headers.common.Authorization =
                'Bearer ' + this.tokenStore.accessToken
        }

        this.logger.debug('Token read successfully')
    }

    private writeTokens(tokens: TokenResponseData) {
        this.logger.debug('Writing new tokens to store and file')
        this.tokenStore = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in * 1000 + Date.now(),
        }

        this.axiosInstance.defaults.headers.common.Authorization =
            'Bearer ' + tokens.access_token

        writeFileSync(this.tokenFilePath, JSON.stringify(this.tokenStore))
        this.logger.debug('Tokens updated successfully')
    }

    async getTokens(code: string) {
        this.logger.debug('Getting new tokens with authorization code')
        const tokenResponse = await this.axiosInstance.post(
            '/token',
            new URLSearchParams({
                client_id: this.configService.get('HH_CLIENT_ID'),
                client_secret: this.configService.get('HH_CLIENT_SECRET'),
                grant_type: 'authorization_code',
                code,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        )

        this.writeTokens(tokenResponse.data)
        this.logger.debug('New tokens acquired and saved')
    }

    async refreshToken() {
        this.logger.debug('Refreshing tokens')
        if (!this.tokenStore.refreshToken) {
            this.logger.error('Refresh token not found, authorization required')
            throw new Error('Authorization is required')
        }

        try {
            const tokenResponse = await this.axiosInstance.post(
                '/token',
                new URLSearchParams({
                    refresh_token: this.tokenStore.refreshToken,
                    grant_type: 'refresh_token',
                    client_id: this.configService.get('HH_CLIENT_ID'),
                    client_secret: this.configService.get('HH_CLIENT_SECRET'),
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            )

            this.writeTokens(tokenResponse.data)
            this.logger.debug('Tokens refreshed successfully')
        } catch (error) {
            this.logger.error('Failed to refresh token:', error.message)
            throw error
        }
    }

    async request(method: Method, url: string, data?: any) {
        this.logger.debug(`Making ${method} request to ${url}`)

        // Check token expiration before making request
        if (this.tokenStore.expiresIn < Date.now()) {
            await this.refreshToken()
        }

        return this.axiosInstance.request({
            method,
            url,
            data,
            headers: {
                'HH-User-Agent': this.configService.get('HH_USER_AGENT', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'),
            },
        })
    }
}
