import { spy } from "mobx"
import { useState } from "react"

if ("production" !== process.env.NODE_ENV) {
    if (!useState) {
        throw new Error("mobx-react-lite requires React with Hooks support")
    }
    if (!spy) {
        throw new Error("mobx-react-lite requires mobx at least version 4 to be available")
    }
}
