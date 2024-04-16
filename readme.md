# Static site with Solid Auth flow

> This is _sample code_ that shows how to authenticate a client-side application with a Solid ID provider. It should be _pretty good_ and _readable_. It is _kind of brittle_ and for a Real App could be adjsuted to specific appliation use cases.

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