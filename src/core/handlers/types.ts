export type HandlerResult = {
    success: boolean
    action: string
    target: string
    message?: string
}

export type Handler = (target: string)=> Promise<HandlerResult>