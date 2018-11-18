import { spy } from "mobx"
import { useState } from "react"

if (!useState) {
    throw new Error("mobx-react-lite requires React 16.7 to be available")
}
if (!spy) {
    throw new Error("mobx-react-lite requires mobx to be available")
}
