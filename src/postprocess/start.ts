import "dotenv/config"
import { postProcess } from "./index"

postProcess()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error)
        process.exit(1)
    })
