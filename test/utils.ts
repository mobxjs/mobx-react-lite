import { configure } from "mobx"

export function resetMobx(): void {
    configure({ enforceActions: "never" })
}
