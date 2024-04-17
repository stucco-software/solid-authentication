const base64ToUint8Array = (base64Contents) =>  {
  base64Contents = base64Contents.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  const content = atob(base64Contents);
  return new Uint8Array(content.split('').map((c) => c.charCodeAt(0)));
}

const stringToUint8Array = (contents) => {
  const encoded = btoa(unescape(encodeURIComponent(contents)));
  return base64ToUint8Array(encoded);
}

const uint8ArrayToString = (unsignedArray) => {
  const base64string = btoa(String.fromCharCode(...unsignedArray));
  return base64string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

const base64Segment = (segment) => {
  const string = JSON.stringify(segment)
  const base64 = uint8ArrayToString(stringToUint8Array(string))
  return base64
}

const signJWT = async ({header, body, privateKey}) => {
  const headerBase64 = base64Segment(header)
  const bodyBase64 = base64Segment(body)
  const jwtMessage = `${headerBase64}.${bodyBase64}`

  const jwtMessageAsUint8Array = stringToUint8Array(jwtMessage)

  const signature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: "SHA-256"
    },
    privateKey,
    jwtMessageAsUint8Array
  );

  const jwtSignature = uint8ArrayToString(new Uint8Array(signature))

  const jwt = `${jwtMessage}.${jwtSignature}`
  return jwt
}


// DPoP stuff for oncewe have a code!
// Thanks IBM! https://docs.verify.ibm.com/ibm-security-verify-access/docs/oauth2-dpop
const generateKey = async () => {
  let keyPair = await window.crypto.subtle.generateKey(
  {
    name: "ECDSA",
    namedCurve: "P-256",
  },
  true,
  ["sign", "verify"],
);
  return keyPair
}

export const createDPoP = async ({code, iss}) => {
  const keyPair = await generateKey()
  const publicJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey)

  const token_endpoint = sessionStorage.getItem('token_endpoint')
  const tokenID = crypto.randomUUID()
  const tokenCreated = new Date().getTime()
  console.log(tokenCreated)
  const tokenHeader = {
    "alg": "ES256",
    "typ": "dpop+jwt",
    "jwk": publicJWK
  }

  const tokenBody = {
    "htu": token_endpoint,
    "htm": "POST",
    "jti": tokenID,
    "iat": tokenCreated
  }
  const jwt = await signJWT({
    header: tokenHeader,
    body: tokenBody,
    privateKey: keyPair.privateKey
  })

  let redirect = 'https://solid-authentication.rdf.systems/'
  let now = new Date().getTime()
  console.log(`signing took ${now - tokenCreated}ms`)
  let r = await fetch(tokenBody.htu, {
    method: tokenBody.htm,
    headers: {
      "DPoP": jwt,
       "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      "grant_type": "authorization_code",
      "code_verifier": sessionStorage.getItem('code_verifier'),
      "code": code,
      "redirect_uri": redirect,
      "client_id": "https://solid-authentication.rdf.systems/webid.json"
    })
  })
  console.log(`fetch took ${new Date().getTime() - now}ms`)
  let data = await r.json()
  sessionStorage.removeItem('code_verifier')
  sessionStorage.setItem('access_token', data.access_token)
  sessionStorage.setItem('refresh_token', data.refresh_token)
  const url = new URL(`${redirect}`)
  window.location = url
}