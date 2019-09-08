import { spy } from "mobx"
import React from "react"

if (!React.useState) {
    throw new Error("mobx-react-lite requires React with Hooks support")
}
if (!spy) {
    throw new Error("mobx-react-lite requires mobx at least version 4 to be available")
}
