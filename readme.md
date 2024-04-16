# Static site with Solid Auth flow

```
import { authenticate, callback } from './auth.js'

// Start Authentication Flow with webID
await authenticate(webID)

// Callback when authenticated
const handleAuthState = () => {
  …
}

callback(handleAuthState)
```