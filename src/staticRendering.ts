let globalIsUsingStaticRendering = false

export function useStaticRendering(enable: boolean) {
    globalIsUsingStaticRendering = enable
}

export function isUsingStaticRendering(): boolean {
    return globalIsUsingStaticRendering
}
